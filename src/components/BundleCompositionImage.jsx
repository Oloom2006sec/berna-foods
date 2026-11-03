import { useEffect, useMemo, useState } from "react";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 900;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load bundle image: ${src}`));
    image.src = src;
  });
}

function getContentBounds(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Unable to prepare product image for bundle composition.");
  }

  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
  let left = canvas.width;
  let top = canvas.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const offset = (y * canvas.width + x) * 4;
      const visible =
        data[offset + 3] > 24 &&
        (data[offset] < 248 ||
          data[offset + 1] < 248 ||
          data[offset + 2] < 248);

      if (visible) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (right <= left || bottom <= top) {
    return {
      x: 0,
      y: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  const marginX = Math.round((right - left) * 0.035);
  const marginY = Math.round((bottom - top) * 0.025);
  const x = Math.max(0, left - marginX);
  const y = Math.max(0, top - marginY);
  const edgeX = Math.min(image.naturalWidth, right + marginX);
  const edgeY = Math.min(image.naturalHeight, bottom + marginY);

  return {
    x,
    y,
    width: edgeX - x,
    height: edgeY - y,
  };
}

function drawRow(context, items, baseline, maxHeight, verticallyCentered = false) {
  const rowWidth = CANVAS_WIDTH * 0.92;
  const cellWidth = rowWidth / items.length;

  items.forEach(({ image, bounds }, index) => {
    const ratio = bounds.width / bounds.height;
    const heightScale = items.length > 3 && index % 2 === 0 ? 0.88 : 1;
    const targetHeight = maxHeight * heightScale;
    const width = Math.min(targetHeight * ratio, cellWidth * 1.12);
    const height = width / ratio;
    const centerX =
      (CANVAS_WIDTH - rowWidth) / 2 + cellWidth * (index + 0.5);
    const x = centerX - width / 2;
    const y = verticallyCentered
      ? (CANVAS_HEIGHT - height) / 2
      : baseline - height;
    const shadowY = verticallyCentered
      ? y + height - 5
      : baseline - 5;

    const shadow = context.createRadialGradient(
      centerX,
      shadowY,
      2,
      centerX,
      shadowY,
      Math.max(18, width * 0.32)
    );
    shadow.addColorStop(0, "rgba(54, 43, 29, 0.13)");
    shadow.addColorStop(1, "rgba(54, 43, 29, 0)");
    context.fillStyle = shadow;
    context.beginPath();
    context.ellipse(
      centerX,
      shadowY + 1,
      Math.max(18, width * 0.32),
      Math.max(7, width * 0.045),
      0,
      0,
      Math.PI * 2
    );
    context.fill();

    context.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      x,
      y,
      width,
      height
    );
  });
}

async function createComposition(items) {
  if (!items.length) {
    throw new Error("A bundle needs at least one product image.");
  }

  const loadedItems = await Promise.all(
    items.map(async (item) => {
      const image = await loadImage(item.image);
      return { image, bounds: getContentBounds(image) };
    })
  );
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create bundle composition.");
  }

  const background = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  background.addColorStop(0, "#ffffff");
  background.addColorStop(1, "#fbfaf7");
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (loadedItems.length <= 2) {
    drawRow(context, loadedItems, 0, 850, true);
  } else {
    const firstRowLength = Math.ceil(loadedItems.length / 2);
    const firstRow = loadedItems.slice(0, firstRowLength);
    const secondRow = loadedItems.slice(firstRowLength);
    drawRow(context, firstRow, 440, 420);
    drawRow(context, secondRow, CANVAS_HEIGHT - 10, 420);
  }

  return canvas.toDataURL("image/webp", 0.92);
}

export default function BundleCompositionImage({
  products,
  className = "",
  alt,
}) {
  const compositionKey = useMemo(
    () =>
      JSON.stringify(
        products.map(({ sku, image }) => ({ sku, image }))
      ),
    [products]
  );
  const [composition, setComposition] = useState({
    key: "",
    src: "",
    error: null,
  });
  const productList = useMemo(
    () => JSON.parse(compositionKey),
    [compositionKey]
  );

  useEffect(() => {
    let cancelled = false;

    createComposition(productList)
      .then((src) => {
        if (!cancelled) {
          setComposition({ key: compositionKey, src, error: null });
        }
      })
      .catch((error) => {
        console.error("Bundle composition image error:", error);
        if (!cancelled) {
          setComposition({ key: compositionKey, src: "", error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [compositionKey, productList]);

  const currentComposition =
    composition.key === compositionKey ? composition : null;

  if (currentComposition?.src) {
    return (
      <img
        className={className}
        src={currentComposition.src}
        alt={alt}
      />
    );
  }

  if (currentComposition?.error) {
    return (
      <div className={`${className} bundle-composition-error`} role="img" aria-label={alt}>
        تعذر تجهيز صورة الباقة
      </div>
    );
  }

  return (
    <div
      className={`${className} bundle-composition-loading`}
      role="img"
      aria-label={alt}
      aria-busy="true"
    />
  );
}
