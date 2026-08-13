<?xml version="1.0" encoding="UTF-8"?>
<!--
  A sitemap that a person can read.

  XML with no stylesheet renders as a blank page in WebKit — Safari builds no
  document body for it at all — so anyone opening the sitemap by hand sees
  nothing and concludes it is broken. Chrome and Firefox happen to inject a
  fallback tree; Safari does not, and neither is required to.

  Crawlers ignore the xml-stylesheet instruction entirely, so this costs the
  machines nothing. It exists for the human doing the checking.

  Fonts are the system stack rather than the page's three families: this is a
  utility view, and it must not pull two hundred kilobytes from Google to draw
  a table of two rows.
-->
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="robots" content="noindex" />
        <title>Sitemap — duty.commutator.io</title>
        <style>
          :root {
            --paper: #fbfaf7;
            --ink: #14181d;
            --muted: #59606a;
            --rule: #d8d4cb;
            --brass: #8a5a12;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --paper: #14171c;
              --ink: #eceae5;
              --muted: #9aa2ad;
              --rule: #333a43;
              --brass: #d2a03f;
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 3rem 1.5rem 5rem;
            background: var(--paper);
            color: var(--ink);
            font: 400 16px/1.6 system-ui, -apple-system, 'Segoe UI', sans-serif;
          }
          main { max-width: 68ch; margin: 0 auto; }
          .kicker {
            margin: 0 0 .5rem;
            color: var(--brass);
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: .14em;
            text-transform: uppercase;
          }
          h1 { margin: 0 0 .75rem; font-size: 1.9rem; line-height: 1.15; letter-spacing: -.01em; }
          .lead { margin: 0 0 2rem; max-width: 60ch; color: var(--muted); font-size: 15px; }
          .wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
          th, td {
            padding: .7rem .9rem .7rem 0;
            border-bottom: 1px solid var(--rule);
            text-align: left;
            vertical-align: top;
          }
          th {
            border-bottom-color: var(--ink);
            color: var(--muted);
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: .1em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          tr:last-child td { border-bottom: none; }
          td.alt { font-variant-numeric: tabular-nums; white-space: nowrap; }
          a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
          a:hover { color: var(--brass); }
          code {
            padding: .1em .35em;
            background: color-mix(in srgb, var(--brass) 12%, transparent);
            font-family: ui-monospace, 'SF Mono', Menlo, monospace;
            font-size: .88em;
          }
          .lang { color: var(--muted); }
          footer {
            margin-top: 2.5rem;
            padding-top: 1.25rem;
            border-top: 1px solid var(--rule);
            color: var(--muted);
            font-size: 13.5px;
          }
        </style>
      </head>
      <body>
        <main>
          <p class="kicker">XML sitemap</p>
          <h1>duty.commutator.io</h1>
          <p class="lead">
            <xsl:value-of select="count(s:urlset/s:url)" />
            <xsl:text> addresses, one per language. Every tab of the page renders from this
            same document, so the tabs are not listed separately. This table is a stylesheet
            over the XML — crawlers read the file underneath and ignore the presentation.</xsl:text>
          </p>

          <div class="wrap">
            <table>
              <tr>
                <th>Address</th>
                <th>Languages declared</th>
              </tr>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td>
                    <a href="{s:loc}"><xsl:value-of select="s:loc" /></a>
                  </td>
                  <td class="alt">
                    <xsl:for-each select="xhtml:link">
                      <!-- Emitted here rather than as a CSS ::before, which does
                           not survive text extraction or a copy-paste. -->
                      <xsl:if test="position() != 1">
                        <xsl:text> · </xsl:text>
                      </xsl:if>
                      <span class="lang"><xsl:value-of select="@hreflang" /></span>
                    </xsl:for-each>
                  </td>
                </tr>
              </xsl:for-each>
            </table>
          </div>

          <footer>
            <p>
              <code>x-default</code> is the address with no language parameter: it follows the
              reader's own browser, which is what the page does when nobody has picked a
              language. See also <a href="/robots.txt">robots.txt</a>.
            </p>
          </footer>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
