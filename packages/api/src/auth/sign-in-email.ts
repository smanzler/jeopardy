/** @param code Digits only. The HTML does not escape it. */
export const renderSignInEmail = ({
  code,
  expiresInMinutes,
}: {
  code: string
  expiresInMinutes: number
}) => {
  const subject = `${code} is your Jeopardy sign-in code`
  const text = `Your sign-in code is ${code}. It expires in ${expiresInMinutes} minutes.\n\nIf you did not ask for this code, you can ignore this email.`
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#060ce9;font-family:Helvetica,Arial,sans-serif;color:#ffffff;text-align:center;">
    <p style="margin:0 0 24px;font-size:20px;font-weight:bold;letter-spacing:2px;color:#ecbb38;">JEOPARDY</p>
    <p style="margin:0 0 16px;font-size:16px;">Your sign-in code is</p>
    <p style="margin:0 0 16px;font-size:36px;font-weight:bold;letter-spacing:10px;font-family:Menlo,monospace;">${code}</p>
    <p style="margin:0 0 32px;font-size:14px;color:#c7cbff;">It expires in ${expiresInMinutes} minutes.</p>
    <p style="margin:0;font-size:12px;color:#c7cbff;">If you did not ask for this code, you can ignore this email.</p>
  </body>
</html>`
  return { subject, text, html }
}
