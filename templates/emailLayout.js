import { env } from "../config/env.js";

const defaultLogo = `
<svg width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" fill-rule="evenodd">
    <path d="M20 10h20c15 0 26 9 26 22s-11 22-26 22H20V10zm12 10v24h8c9 0 14-5 14-12s-5-12-14-12h-8z" fill="#1A1F2E"/>
    <circle cx="72" cy="28" r="10" fill="#C9A063"/>
    <path d="M55 38c0-4 4-8 10-8s10 4 10 8H55z" fill="#1A1F2E"/>
    <path d="M62 30c2-3 4-5 5-8 1 3 3 5 5 8h-10z" fill="#1A1F2E"/>
    <path d="M100 20c3 0 5 2 5 5v15h-3V27c0-1-1-2-2-2s-2 1-2 2v13h-3V25c0-3 2-5 5-5z" fill="#1A1F2E"/>
  </g>
</svg>
`;

const buildEmailLayout = ({
  logoUrl,
  appName,
  primaryColor,
  secondaryColor,
  supportEmail,
  supportPhone,
  websiteUrl,
  bodyHtml,
  footerNote,
  unsubscribeUrl,
  legalTermsUrl,
  legalPrivacyUrl,
}) => {
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${appName}" width="180" style="display:block;max-width:180px;height:auto;" />`
    : defaultLogo;

  const primary = primaryColor || "#1A1F2E";
  const secondary = secondaryColor || "#C9A063";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5;padding:24px 0;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
<tr>
<td style="background-color:${primary};padding:24px;text-align:left;">
${logo}
</td>
</tr>
<tr>
<td style="padding:32px 24px;color:#1A1A1A;font-size:15px;line-height:1.6;">
${bodyHtml}
</td>
</tr>
<tr>
<td style="background-color:${primary};padding:24px;text-align:center;color:#FFFFFF;font-size:12px;line-height:1.6;">
<p style="margin:0 0 8px 0;font-weight:bold;color:${secondary};">${appName}</p>
<p style="margin:0 0 4px 0;">${supportEmail || ""}</p>
<p style="margin:0 0 4px 0;">${supportPhone || ""}</p>
<p style="margin:0 0 12px 0;">${websiteUrl || ""}</p>
<p style="margin:0 0 8px 0;">
<a href="${legalTermsUrl || "#"}" style="color:${secondary};text-decoration:none;">Terms</a>
&nbsp;|&nbsp;
<a href="${legalPrivacyUrl || "#"}" style="color:${secondary};text-decoration:none;">Privacy</a>
</p>
${unsubscribeUrl ? `<p style="margin:0 0 8px 0;"><a href="${unsubscribeUrl}" style="color:${secondary};text-decoration:none;">Unsubscribe</a></p>` : ""}
${footerNote ? `<p style="margin:8px 0 0 0;color:#9AA1B2;">${footerNote}</p>` : ""}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

const buildEmailText = (lines) => lines.filter(Boolean).join("\n");

export { buildEmailLayout, buildEmailText, defaultLogo, env };