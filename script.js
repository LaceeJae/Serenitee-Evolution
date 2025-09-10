/* Serenitee Evolution booking script
 - Edit 'bookedSlots' to mark booked times
 - Paste your Google Apps Script Web App URL into GOOGLE_SHEETS_URL
*/
document.getElementById('year').textContent = new Date().getFullYear();

// CONFIG
const GOOGLE_SHEETS_URL = "PASTE_YOUR_URL_HERE"; // replace with your Apps Script web app URL
const MAILTO_EMAIL = "info@sereniteeevolution.com";

// Demo booked slots (2025)
const bookedSlots = {
  "2025-09-15": ["2:00 PM"],
  "2025-09-20": ["4:00 PM"],
  "2025-10-05": ["10:00 AM"]
};

// Booking opens Jan 1, 2026
const bookingOpenDate = new Date(2026,0,1);

// Hourly slots 9 AM - 9 PM
const slotHours = [];
for(let h=9; h<=21; h++){
  const ampm = h <= 11 ? 'AM' : 'PM';
  const displayHour = ((h+11)%12+1) + ':00 ' + ampm;
  slotHours.push(displayHour);
}

// Calendar state
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

const monthLabel = document.getElementById('monthLabel');
const calendarEl = document.getElementById('calendar');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');

function renderCalendar(year, month){
  calendarEl.innerHTML = '';
  const first = new Date(year, month, 1);
  const last = new Date(year, month+1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();
  monthLabel.textContent = first.toLocaleString('default', {month:'long', year:'numeric'});

  // blanks
  for(let i=0;i<startDay;i++){
    const empty = document.createElement('div');
    empty.className = 'day-cell inactive';
    calendarEl.appendChild(empty);
  }

  for(let d=1; d<=totalDays; d++){
    const fullDate = new Date(year, month, d);
    const iso = fullDate.toISOString().slice(0,10);
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    const num = document.createElement('div');
    num.className = 'date-num';
    num.textContent = d;
    cell.appendChild(num);

    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'slots';
    const selectable = fullDate >= bookingOpenDate;

    slotHours.forEach(s => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const booked = bookedSlots[iso] && bookedSlots[iso].includes(s);
      if(booked){
        slot.classList.add('booked');
        slot.textContent = s + ' — Booked';
      } else {
        slot.textContent = s;
      }

      if(!selectable || booked){
        slot.classList.add('disabled');
      } else {
        slot.addEventListener('click', () => selectSlot(iso, s, slot));
      }

      slotsWrap.appendChild(slot);
    });

    cell.appendChild(slotsWrap);
    calendarEl.appendChild(cell);
  }
}

function selectSlot(dateIso, timeLabel, slotEl){
  document.querySelectorAll('.slot.selected').forEach(n=>n.classList.remove('selected'));
  slotEl.classList.add('selected');
  document.getElementById('bf-date').value = dateIso;
  const timeSelect = document.getElementById('bf-time');
  timeSelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = timeLabel;
  opt.textContent = timeLabel;
  timeSelect.appendChild(opt);
}

prevBtn.addEventListener('click', ()=>{calendarMonth--; if(calendarMonth<0){calendarMonth=11; calendarYear--;} renderCalendar(calendarYear, calendarMonth);});
nextBtn.addEventListener('click', ()=>{calendarMonth++; if(calendarMonth>11){calendarMonth=0; calendarYear++;} renderCalendar(calendarYear, calendarMonth);});

calendarYear = new Date().getFullYear();
calendarMonth = new Date().getMonth();
renderCalendar(calendarYear, calendarMonth);

// Form handling: POST to Google Apps Script and backup mailto. IPN updates sheet separately.
const bookingForm = document.getElementById('bookingForm');
bookingForm.addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('bf-name').value.trim();
  const email = document.getElementById('bf-email').value.trim();
  const service = document.getElementById('bf-service').value;
  const date = document.getElementById('bf-date').value;
  const time = document.getElementById('bf-time').value;
  const message = document.getElementById('bf-message').value.trim();

  if(!date || !time){
    document.getElementById('bookingStatus').innerHTML = '<p style="color:var(--gold)">Please choose a date and time slot before submitting.</p>';
    return;
  }

  const payload = { name, email, service, date, time, notes: message };

  if(GOOGLE_SHEETS_URL && GOOGLE_SHEETS_URL !== 'PASTE_YOUR_URL_HERE'){
    fetch(GOOGLE_SHEETS_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r=>r.json().catch(()=>{}))
      .then(resp=>{ document.getElementById('bookingStatus').innerHTML = '<p style="color:var(--muted)">Booking logged to Sheet. Please complete the $35 deposit via PayPal.</p>'; })
      .catch(err=>{ document.getElementById('bookingStatus').innerHTML = '<p style="color:#ffb3b3">Could not reach Google Sheets. We will still send a backup email.</p>'; });
  } else {
    document.getElementById('bookingStatus').innerHTML = '<p style="color:var(--muted)">Booking recorded locally. Please complete the $35 deposit via PayPal.</p>';
  }

  // Backup mailto
  const subject = encodeURIComponent('Studio Booking Request: ' + date + ' ' + time);
  const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nService: ' + service + '\nDate: ' + date + '\nTime: ' + time + '\nNotes: ' + message);
  window.location.href = 'mailto:' + MAILTO_EMAIL + '?subject=' + subject + '&body=' + body;
});
