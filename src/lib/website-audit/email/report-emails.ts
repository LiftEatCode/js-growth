interface CustomerReportEmailData {
    firstName: string;
    hostname: string;
    overallScore: number;
    opportunityScore: number;
    criticalIssues: number;
    quickWins: number;
    highImpactFindings: number;
  }
  
  interface InternalLeadData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: string | null;
    hostname: string;
    reportId: string;
    overallScore: number;
    opportunityScore: number;
    criticalIssues: number;
  }
  
  function escapeHtml(
    value: string,
  ): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  
  export function buildCustomerReportText(
    data: CustomerReportEmailData,
  ): string {
    return `
  Hi ${data.firstName},
  
  Your Website Growth Report for ${data.hostname} is ready.
  
  Website Score: ${data.overallScore}/100
  Growth Opportunity Score: ${data.opportunityScore}/100
  Critical Issues: ${data.criticalIssues}
  High-Impact Findings: ${data.highImpactFindings}
  Quick Wins: ${data.quickWins}
  
  Your professional PDF report is attached.
  
  The report includes:
  - An executive website overview
  - Category performance scores
  - Priority findings
  - Recommended actions
  - A practical improvement roadmap
  
  If you would like help reviewing the findings or deciding what to tackle first, reply to this email and JS Solutions can walk through the report with you.
  
  JS Solutions
  Grow your business. We build the systems.
    `.trim();
  }
  
  export function buildCustomerReportHtml(
    data: CustomerReportEmailData,
  ): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />
  
      <title>Your Website Growth Report</title>
    </head>
  
    <body
      style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial,Helvetica,sans-serif;
      "
    >
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="background:#f1f5f9;"
      >
        <tr>
          <td
            align="center"
            style="padding:32px 16px;"
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="
                max-width:640px;
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:18px;
                overflow:hidden;
              "
            >
              <tr>
                <td
                  style="
                    padding:32px;
                    background:#0f172a;
                    color:#ffffff;
                  "
                >
                  <div
                    style="
                      margin-bottom:10px;
                      font-size:12px;
                      line-height:18px;
                      font-weight:700;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      color:#67e8f9;
                    "
                  >
                    JS Solutions
                  </div>
  
                  <h1
                    style="
                      margin:0;
                      font-size:28px;
                      line-height:36px;
                      color:#ffffff;
                    "
                  >
                    Your Website Growth Report
                  </h1>
  
                  <p
                    style="
                      margin:10px 0 0;
                      font-size:15px;
                      line-height:24px;
                      color:#cbd5e1;
                    "
                  >
                    ${escapeHtml(data.hostname)}
                  </p>
                </td>
              </tr>
  
              <tr>
                <td style="padding:32px;">
                  <p
                    style="
                      margin:0;
                      font-size:16px;
                      line-height:26px;
                      color:#0f172a;
                    "
                  >
                    Hi ${escapeHtml(data.firstName)},
                  </p>
  
                  <p
                    style="
                      margin:16px 0 0;
                      font-size:16px;
                      line-height:26px;
                      color:#475569;
                    "
                  >
                    Your professional website growth report for
                    <strong style="color:#0f172a;">
                      ${escapeHtml(data.hostname)}
                    </strong>
                    is ready. The PDF is attached to this email.
                  </p>
  
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      margin-top:24px;
                      border-collapse:separate;
                      border-spacing:0;
                      border:1px solid #dbeafe;
                      border-radius:14px;
                      background:#eff6ff;
                    "
                  >
                    <tr>
                      ${buildScoreCell(
                        "Website Score",
                        `${data.overallScore}/100`,
                      )}
  
                      ${buildScoreCell(
                        "Opportunity",
                        `${data.opportunityScore}/100`,
                      )}
  
                      ${buildScoreCell(
                        "Critical Issues",
                        String(data.criticalIssues),
                      )}
                    </tr>
                  </table>
  
                  <div
                    style="
                      margin-top:28px;
                      padding:22px;
                      border:1px solid #e2e8f0;
                      border-radius:14px;
                      background:#f8fafc;
                    "
                  >
                    <div
                      style="
                        font-size:12px;
                        line-height:18px;
                        font-weight:700;
                        letter-spacing:1px;
                        text-transform:uppercase;
                        color:#2563eb;
                      "
                    >
                      Inside Your Report
                    </div>
  
                    ${buildBenefit(
                      "Executive overview",
                      "A clear summary of the website's current condition and strongest opportunities.",
                    )}
  
                    ${buildBenefit(
                      "Priority findings",
                      `${data.highImpactFindings} high-impact findings and ${data.quickWins} quick wins were identified.`,
                    )}
  
                    ${buildBenefit(
                      "Improvement roadmap",
                      "A practical order for addressing the strongest issues first.",
                    )}
                  </div>
  
                  <p
                    style="
                      margin:28px 0 0;
                      font-size:16px;
                      line-height:26px;
                      color:#475569;
                    "
                  >
                    If you'd like help deciding what should be fixed first,
                    reply to this email. We can review the findings with you
                    and turn the audit into a practical implementation plan.
                  </p>
  
                  <div
                    style="
                      margin-top:28px;
                      padding-top:24px;
                      border-top:1px solid #e2e8f0;
                    "
                  >
                    <strong
                      style="
                        display:block;
                        font-size:16px;
                        color:#0f172a;
                      "
                    >
                      JS Solutions
                    </strong>
  
                    <span
                      style="
                        display:block;
                        margin-top:4px;
                        font-size:14px;
                        line-height:22px;
                        color:#64748b;
                      "
                    >
                      Grow your business. We build the systems.
                    </span>
                  </div>
                </td>
              </tr>
            </table>
  
            <p
              style="
                margin:18px 0 0;
                font-size:12px;
                line-height:18px;
                color:#94a3b8;
              "
            >
              Website Growth Intelligence by JS Solutions
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
    `.trim();
  }
  
  export function buildInternalLeadText(
    data: InternalLeadData,
  ): string {
    return `
  New website audit lead
  
  Name: ${data.firstName} ${data.lastName}
  Company: ${data.company ?? "Not provided"}
  Email: ${data.email}
  Phone: ${data.phone ?? "Not provided"}
  Website: ${data.hostname}
  
  Website Score: ${data.overallScore}/100
  Opportunity Score: ${data.opportunityScore}/100
  Critical Issues: ${data.criticalIssues}
  
  Report ID:
  ${data.reportId}
    `.trim();
  }
  
  export function buildInternalLeadHtml(
    data: InternalLeadData,
  ): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
    <body
      style="
        margin:0;
        padding:0;
        background:#f1f5f9;
        font-family:Arial,Helvetica,sans-serif;
      "
    >
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="background:#f1f5f9;"
      >
        <tr>
          <td
            align="center"
            style="padding:32px 16px;"
          >
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="
                max-width:640px;
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:18px;
                overflow:hidden;
              "
            >
              <tr>
                <td
                  style="
                    padding:28px 32px;
                    background:#0f172a;
                    color:#ffffff;
                  "
                >
                  <div
                    style="
                      margin-bottom:8px;
                      font-size:12px;
                      font-weight:700;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      color:#67e8f9;
                    "
                  >
                    JS Solutions
                  </div>
  
                  <h1
                    style="
                      margin:0;
                      font-size:26px;
                      line-height:34px;
                    "
                  >
                    New Website Audit Lead
                  </h1>
                </td>
              </tr>
  
              <tr>
                <td style="padding:32px;">
                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="border-collapse:collapse;"
                  >
                    <tbody>
                      ${buildMetricRow(
                        "Name",
                        `${data.firstName} ${data.lastName}`,
                      )}
  
                      ${buildMetricRow(
                        "Company",
                        data.company ?? "Not provided",
                      )}
  
                      ${buildMetricRow(
                        "Email",
                        data.email,
                      )}
  
                      ${buildMetricRow(
                        "Phone",
                        data.phone ?? "Not provided",
                      )}
  
                      ${buildMetricRow(
                        "Website",
                        data.hostname,
                      )}
  
                      ${buildMetricRow(
                        "Website Score",
                        `${data.overallScore}/100`,
                      )}
  
                      ${buildMetricRow(
                        "Opportunity",
                        `${data.opportunityScore}/100`,
                      )}
  
                      ${buildMetricRow(
                        "Critical Issues",
                        String(data.criticalIssues),
                      )}
                    </tbody>
                  </table>
  
                  <div
                    style="
                      margin-top:24px;
                      padding:16px;
                      border:1px solid #dbeafe;
                      border-radius:12px;
                      background:#eff6ff;
                    "
                  >
                    <div
                      style="
                        font-size:12px;
                        font-weight:700;
                        color:#2563eb;
                        text-transform:uppercase;
                        letter-spacing:1px;
                      "
                    >
                      Report ID
                    </div>
  
                    <div
                      style="
                        margin-top:6px;
                        font-size:13px;
                        line-height:20px;
                        color:#475569;
                        word-break:break-all;
                      "
                    >
                      ${escapeHtml(data.reportId)}
                    </div>
                  </div>
  
                  <p
                    style="
                      margin:24px 0 0;
                      font-size:14px;
                      line-height:22px;
                      color:#64748b;
                    "
                  >
                    Reply directly to this email to respond to the lead.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
    `.trim();
  }
  
  function buildScoreCell(
    label: string,
    value: string,
  ): string {
    return `
  <td
    width="33.33%"
    align="center"
    style="
      padding:20px 10px;
    "
  >
    <div
      style="
        font-size:11px;
        line-height:16px;
        font-weight:700;
        letter-spacing:.7px;
        text-transform:uppercase;
        color:#64748b;
      "
    >
      ${escapeHtml(label)}
    </div>
  
    <div
      style="
        margin-top:7px;
        font-size:23px;
        line-height:28px;
        font-weight:700;
        color:#0f172a;
      "
    >
      ${escapeHtml(value)}
    </div>
  </td>
    `;
  }
  
  function buildBenefit(
    title: string,
    description: string,
  ): string {
    return `
  <div
    style="
      margin-top:16px;
    "
  >
    <div
      style="
        font-size:15px;
        line-height:22px;
        font-weight:700;
        color:#0f172a;
      "
    >
      ${escapeHtml(title)}
    </div>
  
    <div
      style="
        margin-top:3px;
        font-size:14px;
        line-height:22px;
        color:#64748b;
      "
    >
      ${escapeHtml(description)}
    </div>
  </div>
    `;
  }
  
  function buildMetricRow(
    label: string,
    value: string,
  ): string {
    return `
  <tr>
    <td
      style="
        width:170px;
        padding:11px 12px;
        border-bottom:1px solid #e2e8f0;
        font-size:13px;
        font-weight:700;
        color:#0f172a;
        vertical-align:top;
      "
    >
      ${escapeHtml(label)}
    </td>
  
    <td
      style="
        padding:11px 12px;
        border-bottom:1px solid #e2e8f0;
        font-size:13px;
        color:#475569;
        vertical-align:top;
      "
    >
      ${escapeHtml(value)}
    </td>
  </tr>
    `;
  }