export async function GET() {
  const js = `(function() {
  const script = document.currentScript || document.querySelector('script[data-api-key]');
  if (!script) return;

  const apiKey = script.getAttribute('data-api-key');
  if (!apiKey) return;

  const origin = new URL(script.src).origin;

  // Create shadow DOM container
  const host = document.createElement('div');
  host.id = 'bm-widget-host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = \`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .bm-wrap { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .bm-tab { display: flex; align-items: center; gap: 6px; cursor: pointer; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; border: none; padding: 10px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 14px rgba(255,107,91,0.3); transition: transform 0.2s; }
    .bm-tab:hover { transform: scale(1.05); }
    .bm-panel { display: none; width: 320px; max-height: 440px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; margin-bottom: 8px; }
    .bm-panel.open { display: block; }
    .bm-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: linear-gradient(135deg, #ff6b5b, #fb923c); }
    .bm-header-title { font-size: 14px; font-weight: 700; color: #fff; }
    .bm-minimize { cursor: pointer; background: none; border: none; font-size: 16px; color: rgba(255,255,255,0.7); padding: 4px; transition: color 0.15s; }
    .bm-minimize:hover { color: #fff; }
    .bm-list { overflow-y: auto; max-height: 340px; padding: 8px; }
    .bm-offer { background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 10px; padding: 12px; margin-bottom: 8px; transition: box-shadow 0.15s; }
    .bm-offer:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .bm-offer:last-child { margin-bottom: 0; }
    .bm-biz { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .bm-logo { width: 32px; height: 32px; border-radius: 6px; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 16px; overflow: hidden; }
    .bm-logo img { width: 100%; height: 100%; object-fit: cover; }
    .bm-biz-name { font-size: 12px; font-weight: 600; color: #78716c; }
    .bm-biz-cat { font-size: 11px; color: #a8a29e; }
    .bm-title { font-size: 14px; font-weight: 600; color: #1c1917; margin-bottom: 4px; }
    .bm-desc { font-size: 12px; color: #57534e; line-height: 1.4; margin-bottom: 8px; }
    .bm-btn { display: inline-block; cursor: pointer; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; }
    .bm-btn:hover { transform: scale(1.03); box-shadow: 0 2px 8px rgba(255,107,91,0.3); }
    .bm-footer { text-align: center; padding: 8px; font-size: 10px; color: #a8a29e; border-top: 1px solid rgba(0,0,0,0.06); }
    .bm-empty { text-align: center; padding: 24px 16px; color: #78716c; font-size: 13px; }
  \`;
  shadow.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'bm-wrap';
  wrap.innerHTML = \`
    <div class="bm-panel" id="bm-panel">
      <div class="bm-header">
        <div class="bm-header-title">A reason to walk the block</div>
        <button class="bm-minimize" id="bm-minimize">&#8722;</button>
      </div>
      <div class="bm-list" id="bm-list">
        <div class="bm-empty">Loading perks...</div>
      </div>
      <div class="bm-footer">Powered by Block & Mortar</div>
    </div>
    <button class="bm-tab" id="bm-tab">A reason to walk the block</button>
  \`;
  shadow.appendChild(wrap);

  const panel = shadow.getElementById('bm-panel');
  const tab = shadow.getElementById('bm-tab');
  const minimizeBtn = shadow.getElementById('bm-minimize');
  const list = shadow.getElementById('bm-list');

  let isOpen = false;
  tab.addEventListener('click', function() {
    isOpen = true;
    panel.classList.add('open');
    tab.style.display = 'none';
  });
  minimizeBtn.addEventListener('click', function() {
    isOpen = false;
    panel.classList.remove('open');
    tab.style.display = 'flex';
  });

  const catIcons = {
    'Restaurant': '&#127869;',
    'Cafe': '&#9749;',
    'Gym / Fitness': '&#128170;',
    'Salon / Spa': '&#128135;',
    'Retail': '&#128717;',
    'Services': '&#128736;',
    'Entertainment': '&#127917;',
    'Other': '&#11088;'
  };

  fetch(origin + '/api/widget/' + apiKey)
    .then(function(r) { return r.json(); })
    .then(function(offers) {
      if (!offers.length) {
        list.innerHTML = '<div class="bm-empty">No perks available yet. Check back soon!</div>';
        return;
      }
      list.innerHTML = offers.map(function(o) {
        const icon = catIcons[o.businessCategory] || '&#11088;';
        const logo = o.businessLogoUrl
          ? '<img src="' + o.businessLogoUrl + '" alt="">'
          : icon;
        return '<div class="bm-offer">' +
          '<div class="bm-biz">' +
            '<div class="bm-logo">' + logo + '</div>' +
            '<div><div class="bm-biz-name">' + o.businessName + '</div>' +
            '<div class="bm-biz-cat">' + o.businessCategory + '</div></div>' +
          '</div>' +
          '<div class="bm-title">' + o.title + '</div>' +
          '<div class="bm-desc">' + o.description + '</div>' +
          '<button class="bm-btn" data-offer-id="' + o.id + '" data-url="' + (o.redeemUrl || '') + '">Get This Perk</button>' +
        '</div>';
      }).join('');

      list.querySelectorAll('.bm-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var offerId = btn.getAttribute('data-offer-id');
          var url = btn.getAttribute('data-url');
          fetch(origin + '/api/widget/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerId: offerId, propertyApiKey: apiKey })
          }).catch(function() {});
          if (url) window.open(url, '_blank');
        });
      });
    })
    .catch(function() {
      list.innerHTML = '<div class="bm-empty">Unable to load perks right now.</div>';
    });
})();`;

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
