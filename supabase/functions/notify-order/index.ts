const TO = "bernafoods.official@gmail.com";
Deno.serve(async (req) => {
  const payload = await req.json();
  const o = payload.record ?? {};
  const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, "");
  let list: any[] = [];
  try {
    list = typeof o.items === "string" ? JSON.parse(o.items) : (o.items ?? []);
  } catch (_) {}
  const lines = list
    .map((i) => {
      const gift = i.giftQuantity ? ` (+${i.giftQuantity} هدية)` : "";
      return `<li>${esc(i.name)} ${esc(i.weight)} ${esc(i.packageType)} x${esc(i.quantity)}${gift}</li>`;
    })
    .join("");
  const html = `<h2>طلب جديد ${esc(o.order_number)}</h2>
    <p>الاسم: ${esc(o.customer_name)}</p>
    <p>الموبايل: ${esc(o.customer_phone)}</p>
    <p>العنوان: ${esc(o.governorate)} - ${esc(o.area)} - ${esc(o.address)}</p>
    <p>ملاحظات: ${esc(o.notes)}</p>
    <ul>${lines}</ul>
    <p>الشحن: ${esc(o.shipping)} جنيه</p>
    <p>الإجمالي: ${esc(o.total)} جنيه</p>
    <p>العربون المطلوب: ${esc(o.deposit_amount)} جنيه</p>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "Berna Orders <onboarding@resend.dev>",
      to: [TO],
      subject: `طلب جديد من ${esc(o.customer_name)} - ${esc(o.total)} جنيه`,
      html,
    }),
  });
  return new Response(await r.text(), { status: r.ok ? 200 : 500 });
});