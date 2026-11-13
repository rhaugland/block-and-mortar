export async function GET() {
  const js = `(function() {
  var script = document.currentScript || document.querySelector('script[data-api-key]');
  if (!script) return;

  var apiKey = script.getAttribute('data-api-key');
  if (!apiKey) return;

  var origin = new URL(script.src).origin;

  // Default colors
  var C = { primary: '#ff6b5b', accent: '#fb923c', font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", radius: '16px' };

  // Create shadow DOM container
  var host = document.createElement('div');
  host.id = 'bm-widget-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });

  function buildStyles(c) {
    var grad = 'linear-gradient(135deg, ' + c.primary + ', ' + c.accent + ')';
    return '' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    '.bm-wrap { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: ' + c.font + '; }' +
    '.bm-tab { display: flex; align-items: center; gap: 6px; cursor: pointer; background: ' + grad + '; color: #fff; border: none; padding: 10px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.15); transition: transform 0.2s; }' +
    '.bm-tab:hover { transform: scale(1.05); }' +
    '.bm-panel { display: none; width: 320px; max-height: 520px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: ' + c.radius + '; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; margin-bottom: 8px; }' +
    '.bm-panel.open { display: block; }' +
    '.bm-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: ' + grad + '; }' +
    '.bm-header-title { font-size: 14px; font-weight: 700; color: #fff; }' +
    '.bm-minimize { cursor: pointer; background: none; border: none; font-size: 16px; color: rgba(255,255,255,0.7); padding: 4px; transition: color 0.15s; }' +
    '.bm-minimize:hover { color: #fff; }' +
    '.bm-list { overflow-y: auto; max-height: 420px; padding: 8px; }' +
    '.bm-offer { background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: ' + Math.max(parseInt(c.radius) - 4, 6) + 'px; padding: 12px; margin-bottom: 8px; transition: box-shadow 0.15s; }' +
    '.bm-offer:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }' +
    '.bm-offer:last-child { margin-bottom: 0; }' +
    '.bm-biz { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }' +
    '.bm-logo { width: 32px; height: 32px; border-radius: 6px; background: #fef3c7; display: flex; align-items: center; justify-content: center; font-size: 16px; overflow: hidden; }' +
    '.bm-logo img { width: 100%; height: 100%; object-fit: cover; }' +
    '.bm-biz-name { font-size: 12px; font-weight: 600; color: #78716c; }' +
    '.bm-biz-cat { font-size: 11px; color: #a8a29e; }' +
    '.bm-title { font-size: 14px; font-weight: 600; color: #1c1917; margin-bottom: 4px; }' +
    '.bm-desc { font-size: 12px; color: #57534e; line-height: 1.4; margin-bottom: 8px; }' +
    '.bm-btn { display: inline-block; cursor: pointer; background: ' + grad + '; color: #fff; border: none; padding: 6px 14px; border-radius: ' + Math.max(parseInt(c.radius) - 8, 4) + 'px; font-size: 12px; font-weight: 600; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; }' +
    '.bm-btn:hover { transform: scale(1.03); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }' +
    '.bm-btn:disabled { opacity: 0.6; cursor: default; transform: none; }' +
    '.bm-form { display: none; margin-top: 8px; }' +
    '.bm-form.show { display: block; }' +
    '.bm-input { display: block; width: 100%; padding: 7px 10px; margin-bottom: 6px; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px; font-family: ' + c.font + '; outline: none; color: #1c1917; }' +
    '.bm-input:focus { border-color: ' + c.primary + '; box-shadow: 0 0 0 2px ' + c.primary + '20; }' +
    '.bm-form-row { display: flex; gap: 6px; }' +
    '.bm-form-row .bm-input { flex: 1; }' +
    '.bm-submit { display: block; width: 100%; cursor: pointer; background: ' + grad + '; color: #fff; border: none; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: ' + c.font + '; transition: transform 0.15s; }' +
    '.bm-submit:hover { transform: scale(1.02); }' +
    '.bm-submit:disabled { opacity: 0.6; cursor: default; transform: none; }' +
    '.bm-sent { text-align: center; padding: 12px 0 4px; font-size: 12px; color: #22c55e; font-weight: 600; }' +
    '.bm-sent-sub { text-align: center; font-size: 11px; color: #a8a29e; margin-top: 2px; }' +
    '.bm-err { font-size: 11px; color: #ef4444; margin-bottom: 6px; }' +
    '.bm-footer { text-align: center; padding: 8px; font-size: 10px; color: #a8a29e; border-top: 1px solid rgba(0,0,0,0.06); }' +
    '.bm-empty { text-align: center; padding: 24px 16px; color: #78716c; font-size: 13px; }';
  }

  var styleEl = document.createElement('style');
  styleEl.textContent = buildStyles(C);
  shadow.appendChild(styleEl);

  var wrap = document.createElement('div');
  wrap.className = 'bm-wrap';
  wrap.innerHTML =
    '<div class="bm-panel" id="bm-panel">' +
      '<div class="bm-header">' +
        '<div class="bm-header-title">A reason to walk the block</div>' +
        '<button class="bm-minimize" id="bm-minimize">&#8722;</button>' +
      '</div>' +
      '<div class="bm-list" id="bm-list">' +
        '<div class="bm-empty">Loading perks...</div>' +
      '</div>' +
      '<div class="bm-footer">Powered by Block & Mortar</div>' +
    '</div>' +
    '<button class="bm-tab" id="bm-tab">A reason to walk the block</button>';
  shadow.appendChild(wrap);

  var panel = shadow.getElementById('bm-panel');
  var tab = shadow.getElementById('bm-tab');
  var minimizeBtn = shadow.getElementById('bm-minimize');
  var list = shadow.getElementById('bm-list');

  var isOpen = false;
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

  var catIcons = {
    'Restaurant': '&#127869;',
    'Cafe': '&#9749;',
    'Gym / Fitness': '&#128170;',
    'Salon / Spa': '&#128135;',
    'Retail': '&#128717;',
    'Services': '&#128736;',
    'Entertainment': '&#127917;',
    'Other': '&#11088;'
  };

  // Ping to confirm widget is installed
  fetch(origin + '/api/widget/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: apiKey })
  }).catch(function() {});

  fetch(origin + '/api/widget/' + apiKey)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var offers = data.offers || data;
      var customStyle = data.style;

      if (customStyle) {
        C.primary = customStyle.primaryColor || C.primary;
        C.accent = customStyle.accentColor || C.accent;
        C.font = customStyle.fontFamily ? (customStyle.fontFamily + ", " + C.font) : C.font;
        C.radius = customStyle.borderRadius || C.radius;
        styleEl.textContent = buildStyles(C);
      }

      if (!offers || !offers.length) {
        list.innerHTML = '<div class="bm-empty">No perks available yet. Check back soon!</div>';
        return;
      }

      list.innerHTML = offers.map(function(o, i) {
        var icon = catIcons[o.businessCategory] || '&#11088;';
        var logo = o.businessLogoUrl
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
          '<button class="bm-btn" data-offer-id="' + o.id + '" data-idx="' + i + '">Get This Perk</button>' +
          '<div class="bm-form" id="bm-form-' + i + '">' +
            '<div class="bm-err" id="bm-err-' + i + '" style="display:none;"></div>' +
            '<div class="bm-form-row">' +
              '<input class="bm-input" id="bm-fn-' + i + '" placeholder="First name" />' +
              '<input class="bm-input" id="bm-ln-' + i + '" placeholder="Last name" />' +
            '</div>' +
            '<input class="bm-input" id="bm-em-' + i + '" placeholder="Email address" type="email" />' +
            '<button class="bm-submit" id="bm-sub-' + i + '" data-offer-id="' + o.id + '" data-idx="' + i + '">Send My Perk</button>' +
          '</div>' +
          '<div class="bm-sent" id="bm-sent-' + i + '" style="display:none;">Perk sent! Check your email.</div>' +
          '<div class="bm-sent-sub" id="bm-sent-sub-' + i + '" style="display:none;">Open the link in your email to redeem at the business.</div>' +
        '</div>';
      }).join('');

      // Toggle claim form on "Get This Perk"
      list.querySelectorAll('.bm-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = btn.getAttribute('data-idx');
          var form = shadow.getElementById('bm-form-' + idx);
          form.classList.toggle('show');
          if (form.classList.contains('show')) {
            btn.style.display = 'none';
          }
        });
      });

      // Handle form submission
      list.querySelectorAll('.bm-submit').forEach(function(sub) {
        sub.addEventListener('click', function() {
          var idx = sub.getAttribute('data-idx');
          var offerId = sub.getAttribute('data-offer-id');
          var fn = shadow.getElementById('bm-fn-' + idx).value.trim();
          var ln = shadow.getElementById('bm-ln-' + idx).value.trim();
          var em = shadow.getElementById('bm-em-' + idx).value.trim();
          var errEl = shadow.getElementById('bm-err-' + idx);

          if (!fn || !ln || !em) {
            errEl.textContent = 'Please fill in all fields.';
            errEl.style.display = 'block';
            return;
          }
          if (em.indexOf('@') === -1) {
            errEl.textContent = 'Please enter a valid email.';
            errEl.style.display = 'block';
            return;
          }

          errEl.style.display = 'none';
          sub.disabled = true;
          sub.textContent = 'Sending...';

          fetch(origin + '/api/widget/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerId: offerId, propertyApiKey: apiKey, firstName: fn, lastName: ln, email: em })
          })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (res.success) {
              shadow.getElementById('bm-form-' + idx).style.display = 'none';
              shadow.getElementById('bm-sent-' + idx).style.display = 'block';
              shadow.getElementById('bm-sent-sub-' + idx).style.display = 'block';
            } else {
              errEl.textContent = res.error || 'Something went wrong.';
              errEl.style.display = 'block';
              sub.disabled = false;
              sub.textContent = 'Send My Perk';
            }
          })
          .catch(function() {
            errEl.textContent = 'Something went wrong. Please try again.';
            errEl.style.display = 'block';
            sub.disabled = false;
            sub.textContent = 'Send My Perk';
          });
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
