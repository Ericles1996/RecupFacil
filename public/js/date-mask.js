// Mobile-friendly date input helpers (DD/MM/YYYY <-> YYYY-MM-DD)
(function(){
  function maskDate(el){
    if(!el) return;
    let v = (el.value || '').replace(/\D/g, '').slice(0,8);
    if(v.length >= 5){
      el.value = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
    } else if(v.length >= 3){
      el.value = v.slice(0,2) + '/' + v.slice(2);
    } else {
      el.value = v;
    }
  }

  function toISODate(s){
    if(!s) return '';
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(!m) return '';
    const d = m[1], mo = m[2], y = m[3];
    return y + '-' + mo + '-' + d;
  }

  function toDisplayDate(s){
    if(!s) return '';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m) return '';
    const y = m[1], mo = m[2], d = m[3];
    return d + '/' + mo + '/' + y;
  }

  function wireField(displayId, hiddenId){
    const disp = document.getElementById(displayId);
    const hid = document.getElementById(hiddenId);
    if(!disp || !hid) return;

    // Prefill display from hidden if possible
    if(hid.value){
      const formatted = toDisplayDate(hid.value);
      if(formatted) disp.value = formatted;
    } else if(disp.value && disp.value.indexOf('-') > -1){
      const formatted = toDisplayDate(disp.value);
      if(formatted) disp.value = formatted;
    }

    // Keep hidden updated
    disp.addEventListener('input', function(){
      maskDate(disp);
      hid.value = toISODate(disp.value);
    });
    disp.addEventListener('blur', function(){
      hid.value = toISODate(disp.value);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    wireField('birthdate_display', 'birthdate');
    wireField('data_nascimento_display', 'data_nascimento');

    // Ensure hidden values are ISO just before submit
    document.querySelectorAll('form').forEach(function(form){
      form.addEventListener('submit', function(){
        var bdDisp = document.getElementById('birthdate_display');
        var bdHid = document.getElementById('birthdate');
        if(bdDisp && bdHid){ bdHid.value = toISODate(bdDisp.value); }

        var dnDisp = document.getElementById('data_nascimento_display');
        var dnHid = document.getElementById('data_nascimento');
        if(dnDisp && dnHid){ dnHid.value = toISODate(dnDisp.value); }
      });
    });
  });
})();

