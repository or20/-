(function(){
  function applyFix(){
    if(!window.me || !window.db || !me.id) return false;
    const initKey = 'e10_initialized_' + me.id;
    const planKey = 'e10_plan_' + me.id;
    if(localStorage.getItem(initKey) !== '1'){
      localStorage.setItem(planKey,'daily');
      localStorage.setItem(initKey,'1');
      me.skip_today = false;
      db.from('customers').update({skip_today:false}).eq('id',me.id).then(function(){
        if(typeof screen === 'function') screen();
      });
    }
    if(typeof choosePlan === 'function'){
      const oldChoosePlan = choosePlan;
      window.choosePlan = function(p){
        oldChoosePlan(p);
        if(p === 'daily'){
          window.draftToday = true;
          if(typeof screen === 'function') screen();
        }
        if(p === 'manual'){
          window.draftToday = false;
          if(typeof screen === 'function') screen();
        }
      }
    }
    return true;
  }
  let tries = 0;
  const t = setInterval(function(){
    tries++;
    if(applyFix() || tries > 40) clearInterval(t);
  },250);
})();