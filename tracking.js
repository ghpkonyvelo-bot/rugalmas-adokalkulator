(function(){
  'use strict';

  var EMBED_MODE = new URLSearchParams(window.location.search).get('embed') === '1';
  if (!EMBED_MODE || window.parent === window) return;

  function send(eventName){
    try {
      window.parent.postMessage({
        type: 'rugalmas-adokalkulator-event',
        event: eventName
      }, '*');
    } catch (e) {
      // Analytics must never interfere with calculator functionality.
    }
  }

  var started = false;

  document.querySelectorAll('.next').forEach(function(button){
    button.addEventListener('click', function(){
      if (!started && button.dataset.next === '2') {
        started = true;
        send('calculator_started');
      }
    });
  });

  var calculateButton = document.getElementById('calculate');
  if (calculateButton) {
    calculateButton.addEventListener('click', function(){
      var revenue = document.getElementById('revenue');
      var numericRevenue = revenue
        ? Number(String(revenue.value || '').replace(/[^0-9]/g, '')) || 0
        : 0;
      if (numericRevenue > 0) send('calculator_completed');
    });
  }

  var contactLink = document.querySelector('.cta a');
  if (contactLink) {
    contactLink.addEventListener('click', function(){
      send('contact_clicked');
    });
  }
})();