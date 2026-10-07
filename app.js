const PARAMS={
  kata:{threshold:22000000,rateExcess:.40,payerRate:.15,monthlyMain:100000,monthlyOther:50000},
  flat:{generalRatio:.50,tb:.185,szocho:.13,szja:.15},
  entrepreneur:{profitTax:.09,szja:.15,tb:.185,szocho:.13,dividendSzja:.15},
  kiva:{rate:.10,dividendSzja:.15,dividendSzocho:.13},
  hipa:{simpleBands:[[12000000,2500000],[18000000,6000000],[25000000,8500000]]},
  chamber:5000
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>Math.round(Number(n)||0).toLocaleString('hu-HU')+' Ft';
const parseMoney=v=>Number(String(v??'').replace(/[^0-9-]/g,''))||0;
function formatInput(el){const n=parseMoney(el.value);el.value=n?n.toLocaleString('hu-HU'):''}
$$('input[inputmode="numeric"]').forEach(el=>{el.addEventListener('blur',()=>formatInput(el));el.addEventListener('focus',()=>{const n=parseMoney(el.value);el.value=n||''})});
function val(id){return parseMoney($(id).value)}
function radio(name){return document.querySelector('input[name="'+name+'"]:checked')?.value}
function showPanel(n){$$('.panel').forEach(x=>x.classList.toggle('is-active',x.dataset.panel==n));$$('.step').forEach(x=>x.classList.toggle('is-active',x.dataset.goto==n));window.scrollTo({top:0,behavior:'smooth'})}
$$('.next').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.next)));$$('.back').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.back)));$$('.step').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.goto<4)showPanel(b.dataset.goto)}));
$('#considerKft').addEventListener('change',e=>$('#kftOptions').style.display=e.target.checked?'block':'none');
function syncRevenue(){const total=val('#revenue'),p=val('#privateRevenue'),k=val('#payerRevenue'),d=p+k-total;const box=$('#revenueCheck');if(d===0){box.className='statusbox ok';box.textContent='✓ Összesen: '+fmt(total)+' – megegyezik az 1. lépésben megadott bevétellel.'}else{box.className='statusbox bad';box.textContent='! A két rész összege '+fmt(p+k)+', ami '+fmt(Math.abs(d))+' eltérés az éves bevételhez képest.'}}
['#revenue','#privateRevenue','#payerRevenue'].forEach(s=>$(s).addEventListener('blur',syncRevenue));syncRevenue();
function hipaSimpleBase(revenue){for(const [limit,base] of PARAMS.hipa.simpleBands)if(revenue<=limit)return base;return null}
function hipaSimple(revenue,rate){const b=hipaSimpleBase(revenue);return b===null?null:b*rate}
function lowerBound(status,minWage){return status==='main'?minWage*12:0}
function flatTax(a){
 const income=a.revenue*(1-a.expenseRatio), taxFree=a.minWage*12*.5, taxable=Math.max(0,income-taxFree);
 let contribBase=0;
 if(a.status==='retired')contribBase=0;
 else if(a.status==='main')contribBase=Math.max(taxable,lowerBound(a.status,a.minWage));
 else contribBase=taxable;
 const szja=taxable*PARAMS.flat.szja, tb=a.status==='retired'?0:contribBase*PARAMS.flat.tb, szocho=a.status==='retired'?0:contribBase*PARAMS.flat.szocho;
 const hipa=hipaSimple(a.revenue,a.hipaRate)??Math.max(0,(a.revenue-a.realCosts))*a.hipaRate;
 return {name:'Átalányadó',eligible:true,total:szja+tb+szocho+hipa+PARAMS.chamber,parts:{szja,tb,szocho,hipa},note:'2027-es '+Math.round(a.expenseRatio*100)+'%-os költséghányaddal becsülve.'}
}
function kataTax(a){
 const reasons=[]; let eligible=true;
 const monthly=a.status==='main'?PARAMS.kata.monthlyMain:PARAMS.kata.monthlyOther, fixed=monthly*12;
 const concentration=a.revenue? a.largestPayer/a.revenue:0;
 if(a.formerEmployer==='yes'){eligible=false;reasons.push('Jelenlegi vagy az elmúlt 24 hónapban volt munkáltató felé számlázás kizárási/kockázati ok.')}
 if(a.rental==='yes'){eligible=false;reasons.push('A megadott ingatlan-bérbeadási tevékenység miatt az ÚJ KATA nem kezelhető automatikusan választhatóként.')}
 if(concentration>=.5){eligible=false;reasons.push('Egyetlen kifizető és kapcsolt vállalkozásai elérik a teljes bevétel 50%-át.')}
 const payerTax=Math.max(0,a.payerRevenue*PARAMS.kata.payerRate-fixed);
 const excess=Math.max(0,a.revenue-PARAMS.kata.threshold)*PARAMS.kata.rateExcess;
 const hipa=hipaSimple(a.revenue,a.hipaRate)??Math.max(0,(a.revenue-a.realCosts))*a.hipaRate;
 if(a.revenue>PARAMS.kata.threshold)reasons.push('A 22 millió Ft feletti részre 40%-os különadóval számolunk.');
 if(payerTax>0)reasons.push('A kifizetői bevétel után a fix KATA-val csökkentett 15%-os kiegészítő adó keletkezik.');
 else reasons.push('A kifizetői bevétel 15%-a nem haladja meg az éves tételes KATA összegét, ezért a becsült kiegészítő adó 0 Ft.');
 return {name:'ÚJ KATA 2027',eligible,total:fixed+payerTax+excess+hipa+PARAMS.chamber,parts:{fixed,payerTax,excess,hipa},reasons}
}
function entrepreneurTax(a){
 const withdrawal=a.status==='main'?a.minWage*12:0;
 const profitBefore=Math.max(0,a.revenue-a.realCosts-withdrawal);
 const profitTax=profitBefore*PARAMS.entrepreneur.profitTax;
 const dividendBase=Math.max(0,profitBefore-profitTax);
 const withdrawalSzja=withdrawal*PARAMS.entrepreneur.szja;
 const withdrawalTb=a.status==='retired'?0:withdrawal*PARAMS.entrepreneur.tb;
 const withdrawalSzocho=a.status==='retired'?0:withdrawal*PARAMS.entrepreneur.szocho;
 const dividendSzja=dividendBase*PARAMS.entrepreneur.dividendSzja;
 const cap=Math.max(0,a.minWage*24-withdrawal);
 const dividendSzocho=Math.min(dividendBase,cap)*PARAMS.entrepreneur.szocho;
 const hipa=hipaSimple(a.revenue,a.hipaRate)??Math.max(0,a.revenue-a.realCosts)*a.hipaRate;
 return {name:'Vállalkozói SZJA',eligible:true,total:profitTax+withdrawalSzja+withdrawalTb+withdrawalSzocho+dividendSzja+dividendSzocho+hipa+PARAMS.chamber,parts:{profitTax,withdrawalSzja,withdrawalTb,withdrawalSzocho,dividendSzja,dividendSzocho,hipa},note:'Egyszerűsített becslés, minimum kivéttel és teljes vállalkozói osztalékalap-kivonással.'}
}
function kivaTax(a){
 if(!a.considerKft)return {name:'KIVA-s Kft.',eligible:false,total:Infinity,hidden:true};
 let salary=a.ownerSalary;
 if(!salary && a.status==='main')salary=a.minWage*12;
 const salaryEmployeeTax=salary*.15+(a.status==='retired'?0:salary*.185);
 const salaryKiva=salary*PARAMS.kiva.rate;
 const operatingProfit=Math.max(0,a.revenue-a.realCosts-salary-salaryKiva);
 const preliminaryHipaSimple=hipaSimple(a.revenue,a.hipaRate);
 const preliminaryHipaKiva=(salary*1.2)*a.hipaRate;
 const preHipa=(preliminaryHipaSimple===null?preliminaryHipaKiva:Math.min(preliminaryHipaSimple,preliminaryHipaKiva));
 const cashForOwner=Math.max(0,operatingProfit-preHipa-PARAMS.chamber);
 const dividend=Math.max(0,cashForOwner*a.profitPolicy/(1+PARAMS.kiva.rate));
 const kivaBase=salary+dividend;
 const kiva=kivaBase*PARAMS.kiva.rate;
 const hKiva=kivaBase*1.2*a.hipaRate;
 const hSimple=hipaSimple(a.revenue,a.hipaRate);
 const hipa=hSimple===null?hKiva:Math.min(hSimple,hKiva);
 const dividendSzja=dividend*PARAMS.kiva.dividendSzja;
 const szochoCap=Math.max(0,a.minWage*24-salary);
 const dividendSzocho=Math.min(dividend,szochoCap)*PARAMS.kiva.dividendSzocho;
 const ownerNetSalary=salary-salaryEmployeeTax;
 const ownerNetDividend=dividend-dividendSzja-dividendSzocho;
 const retained=Math.max(0,a.revenue-a.realCosts-salary-kiva-hipa-PARAMS.chamber-dividend);
 const total=kiva+salaryEmployeeTax+dividendSzja+dividendSzocho+hipa+PARAMS.chamber;
 return {name:'KIVA-s Kft.',eligible:true,total,parts:{salary,kiva,hipa,dividend,dividendSzja,dividendSzocho},ownerNet:ownerNetSalary+ownerNetDividend,retained,totalValue:ownerNetSalary+ownerNetDividend+retained,hipaMethod:hSimple!==null&&hSimple<=hKiva?'egyszerűsített kisvállalkozói HIPA':'KIVA-adóalap 120%-a szerinti HIPA'}
}
function getData(){
 const revenue=val('#revenue'), privateRevenue=val('#privateRevenue'), payerRevenue=val('#payerRevenue');
 return {revenue,privateRevenue,payerRevenue,largestPayer:val('#largestPayer'),status:radio('status'),formerEmployer:radio('formerEmployer'),rental:radio('rental'),expenseRatio:+$('#expenseRatio').value,realCosts:val('#realCosts'),considerKft:$('#considerKft').checked,profitPolicy:+$('#profitPolicy').value,ownerSalary:val('#ownerSalary'),minWage:val('#minWage')||374600,hipaRate:+$('#hipaRate').value}
}
function labelDifference(d){if(d<=150000)return ['Közel azonos','mid'];if(d<=500000)return ['Mérlegelendő','mid'];return ['Drágább','bad']}
function calculate(){
 const a=getData();
 if(!a.revenue){alert('Add meg a várható éves bevételt.');showPanel(1);return}
 if(a.privateRevenue+a.payerRevenue!==a.revenue){alert('A magánszemély és kifizetői bevétel összege egyezzen meg az éves bevétellel.');showPanel(2);return}
 const items=[kataTax(a),flatTax(a),entrepreneurTax(a),kivaTax(a)].filter(x=>!x.hidden);
 const eligible=items.filter(x=>x.eligible&&Number.isFinite(x.total));
 const best=eligible.reduce((m,x)=>!m||x.total<m.total?x:m,null);
 const body=$('#resultsBody');body.innerHTML='';
 items.forEach(x=>{const tr=document.createElement('tr');if(best===x)tr.className='best';let diff='',pill='';if(!x.eligible){diff='–';pill='<span class="pill bad">Nem választható / kockázatos</span>'}else if(best===x){diff='–';pill='<span class="pill good">Legkedvezőbb</span>'}else{const d=x.total-best.total;diff='+ '+fmt(d);const [t,c]=labelDifference(d);pill='<span class="pill '+c+'">'+t+'</span>'}tr.innerHTML='<td><b>'+x.name+'</b></td><td>'+(x.eligible?fmt(x.total):'–')+'</td><td>'+diff+'</td><td>'+pill+'</td>';body.appendChild(tr)});
 const gap=eligible.length>1?[...eligible].sort((a,b)=>a.total-b.total)[1].total-best.total:0;
 const strong=gap>500000;
 $('#winner').className='winner '+(strong?'good':'warn');
 $('#winner').innerHTML='<h3>'+(strong?'Legkedvezőbbnek tűnik: ':'A legkedvezőbb becslés: ')+best.name+'</h3><div>Becsült éves közteher: <b>'+fmt(best.total)+'</b>'+(gap?'. A következő lehetőséghez képest '+fmt(gap)+' eltérés.':'')+'</div>';
 const kata=items.find(x=>x.name.startsWith('ÚJ KATA'));
 const reasons=[];
 if(kata){if(kata.eligible){reasons.push('A megadott KATA-jogosultsági ellenőrzések alapján nem találtunk automatikus kizáró okot.');reasons.push(...kata.reasons)}else{reasons.push('Az ÚJ KATA-t a megadott adatok alapján nem rangsoroljuk választhatóként.');reasons.push(...kata.reasons)}}
 if(a.revenue<=22000000)reasons.push('A 2027-re jelzett 22 millió Ft-os alanyi áfamentességi értékhatár alatt vagy; az AAM külön feltételeit ettől még ellenőrizni kell.');
 $('#reasoning').innerHTML='<h3>Miért ezt látod?</h3><ul>'+reasons.map(r=>'<li>'+r+'</li>').join('')+'</ul>';
 const kft=items.find(x=>x.name==='KIVA-s Kft.');
 $('#kftDetail').innerHTML=kft&&kft.eligible?'<h3>KIVA-s Kft. – plusz nézőpont</h3><p>A tulajdonoshoz becslés szerint <b>'+fmt(kft.ownerNet)+'</b> nettó pénz kerül, és <b>'+fmt(kft.retained)+'</b> marad a cégben. A kettő együtt: <b>'+fmt(kft.totalValue)+'</b>.</p><p>A HIPA-becslésnél a kedvezőbb számított módszer: <b>'+kft.hipaMethod+'</b>.</p>':'';
 showPanel(4)
}
$('#calculate').addEventListener('click',calculate);$('#restart').addEventListener('click',()=>{showPanel(1)});
