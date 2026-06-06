interface EmailReportData {
  startDate: string;
  endDate: string;
  focusHours: number;
  focusScore: number;
  sessionCount: number;
  completedCount: number;
  unlockReasons: Record<string, number>;
  topDistractions: { domain: string; count: number }[];
  productivityChange: number;
  aiSummary: string;
}

export function generateEmailReportHtml(data: EmailReportData): string {
  const isPositive = data.productivityChange >= 0;
  const trendColor = isPositive ? '#10B981' : '#EF4444';
  const trendSign = isPositive ? '+' : '';
  const completionRate = data.sessionCount > 0 ? Math.round((data.completedCount / data.sessionCount) * 100) : 0;

  const distractionsList = data.topDistractions.length > 0
    ? data.topDistractions.map(d => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 10px 0; color: #E2E8F0; font-size: 13px;">${d.domain}</td>
          <td style="padding: 10px 0; color: #A0AEC0; font-size: 13px; text-align: right; font-weight: bold;">${d.count} blocks</td>
        </tr>
      `).join('')
    : `<tr><td colspan="2" style="padding: 12px 0; color: #718096; font-size: 13px; text-align: center;">No distractions recorded. Great job!</td></tr>`;

  const unlockList = Object.entries(data.unlockReasons).length > 0
    ? Object.entries(data.unlockReasons).map(([r, c]) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 10px 0; color: #E2E8F0; font-size: 13px;">${r}</td>
          <td style="padding: 10px 0; color: #A0AEC0; font-size: 13px; text-align: right; font-weight: bold;">${c} times</td>
        </tr>
      `).join('')
    : `<tr><td colspan="2" style="padding: 12px 0; color: #718096; font-size: 13px; text-align: center;">No emergency unlocks requested. Excellent focus!</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepWork AI Weekly Focus Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0A0B; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #121217; border: 1px solid #22222D; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1, #4F46E5); padding: 40px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <div style="background-color: rgba(255,255,255,0.15); width: 44px; height: 44px; border-radius: 12px; display: inline-block; text-align: center;">
                      <span style="font-size: 24px; line-height: 44px; color: #FFFFFF;">🧠</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="color: #FFFFFF; font-size: 22px; font-weight: 800; tracking-tight: -0.025em; margin: 0; padding-bottom: 4px;">
                    Weekly Focus Insights
                  </td>
                </tr>
                <tr>
                  <td style="color: #E0E7FF; font-size: 13px; font-weight: 500; opacity: 0.9;">
                    Report Period: ${data.startDate} to ${data.endDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                
                <!-- AI Summary Callout -->
                <tr>
                  <td style="background-color: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.2); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #818CF8; letter-spacing: 0.05em; padding-bottom: 8px;">
                          ✨ AI Focus Coach Summary
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #E2E8F0; font-size: 14px; line-height: 1.6; font-style: italic; font-weight: 500;">
                          "${data.aiSummary}"
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Metrics Grid -->
                <tr>
                  <td style="padding-top: 30px; padding-bottom: 30px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Focus Hours -->
                        <td width="48%" style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center;">
                          <div style="color: #718096; font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 8px;">Focus Time</div>
                          <div style="color: #FFFFFF; font-size: 28px; font-weight: 800;">${data.focusHours}h</div>
                          <div style="color: #A0AEC0; font-size: 11px; padding-top: 4px;">deep work logged</div>
                        </td>
                        <td width="4%">&nbsp;</td>
                        <!-- Focus Score -->
                        <td width="48%" style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center;">
                          <div style="color: #718096; font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 8px;">Focus Score</div>
                          <div style="color: #818CF8; font-size: 28px; font-weight: 800;">${data.focusScore}/100</div>
                          <div style="color: #A0AEC0; font-size: 11px; padding-top: 4px;">avg effectiveness</div>
                        </td>
                      </tr>
                      <tr style="height: 16px;"><td colspan="3"></td></tr>
                      <tr>
                        <!-- Productivity Change -->
                        <td width="48%" style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center;">
                          <div style="color: #718096; font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 8px;">Productivity Change</div>
                          <div style="color: ${trendColor}; font-size: 28px; font-weight: 800;">${trendSign}${data.productivityChange}%</div>
                          <div style="color: #A0AEC0; font-size: 11px; padding-top: 4px;">vs previous week</div>
                        </td>
                        <td width="4%">&nbsp;</td>
                        <!-- Completion Rate -->
                        <td width="48%" style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; text-align: center;">
                          <div style="color: #718096; font-size: 11px; font-weight: 600; text-transform: uppercase; padding-bottom: 8px;">Completion Rate</div>
                          <div style="color: #10B981; font-size: 28px; font-weight: 800;">${completionRate}%</div>
                          <div style="color: #A0AEC0; font-size: 11px; padding-top: 4px;">${data.completedCount} / ${data.sessionCount} sessions</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Lists Section -->
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Top Distractions -->
                        <td width="48%" valign="top">
                          <div style="color: #FFFFFF; font-size: 14px; font-weight: 700; border-bottom: 2px solid #818CF8; padding-bottom: 8px; margin-bottom: 12px;">Top Distractions</div>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            ${distractionsList}
                          </table>
                        </td>
                        <td width="4%">&nbsp;</td>
                        <!-- Unlock Reasons -->
                        <td width="48%" valign="top">
                          <div style="color: #FFFFFF; font-size: 14px; font-weight: 700; border-bottom: 2px solid #818CF8; padding-bottom: 8px; margin-bottom: 12px;">Unlock Reasons</div>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            ${unlockList}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0E0E12; padding: 30px; text-align: center; border-top: 1px solid #22222D;">
              <span style="color: #718096; font-size: 11px; font-weight: 500;">
                Sent automatically by your DeepWork AI Assistant. Lock in and protect your flow.
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
