(() => {
  'use strict';

  const P = () => window.CarrowmontPdfExport;
  const L = () => window.CarrowmontLocale;
  const W = 794, H = 1123, M = 42, CW = W - M * 2;
  const C = {
    ink:'#102945', navy:'#102945', teal:'#0e8b80', tealDark:'#08756d', muted:'#405b75',
    line:'#c9d9e2', pale:'#e8f6f3', note:'#f3f8fa', white:'#fff', light:'#f8fbfc'
  };

  function page(){ return P().createPage({ width:W, height:H, scale:2.6, background:'#fff' }); }
  function card(ctx,x,y,w,h,fill=C.white,stroke=C.line,r=10){ P().roundRect(ctx,x,y,w,h,r,fill,stroke,1); }
  function hline(ctx,x1,x2,y,color=C.line,width=1){ P().line(ctx,x1,y,x2,y,color,width); }
  function region(){ return L()?.getRegion?.() || 'OTHER'; }
  function isIndia(regionCode=region()){ return regionCode === 'IN'; }

  function investmentIdentity(regionCode=region()){
    if(isIndia(regionCode)){
      return {
        toolName:'SIP Calculator',
        supportingName:'Recurring Investment Calculator',
        reportTitle:'SIP Planning Report',
        preparedFrom:'Carrowmont SIP Calculator',
        noun:'SIP',
        contributionTerm:'SIP contribution',
        reportAction:'Generate SIP Report',
        planningPhrase:'SIP investing'
      };
    }
    return {
      toolName:'Recurring Investment Calculator',
      supportingName:'',
      reportTitle:'Recurring Investment Planning Report',
      preparedFrom:'Carrowmont Recurring Investment Calculator',
      noun:'investment',
      contributionTerm:'investment contribution',
      reportAction:'Generate Investment Report',
      planningPhrase:'recurring investing'
    };
  }

  function housingIdentity(regionCode=region()){
    const map={
      IN:{title:'Home Loan Prepayment',desc:'See how extra EMI principal payments, part-prepayments or early foreclosure could change interest and remaining tenure.'},
      US:{title:'Mortgage Payoff',desc:'See how extra principal, lump-sum payments or an earlier payoff target could change mortgage interest and time to debt-free.'},
      CA:{title:'Mortgage Prepayment & Payoff',desc:'Explore extra payments and lump-sum prepayments using a mortgage payoff model with Canadian fixed-rate convention support.'},
      GB:{title:'Mortgage Overpayment',desc:'Explore how mortgage overpayments or a lump sum could reduce interest and shorten the remaining term.'},
      AU:{title:'Home Loan Extra Repayments',desc:'See how extra repayments or a lump sum could reduce home-loan interest and shorten the loan.'},
      NZ:{title:'Home Loan Extra Repayments',desc:'See how extra repayments or a lump sum could reduce mortgage interest and shorten the remaining loan.'},
      IE:{title:'Mortgage Overpayment',desc:'See how mortgage overpayments or an early repayment could change interest and remaining term.'}
    };
    return map[regionCode]||{title:'Mortgage / Home Loan Payoff',desc:'See how extra payments, prepayments or an earlier payoff target could change interest and time to debt-free.'};
  }

  function toolCatalog(regionCode=region()){
    const investment = investmentIdentity(regionCode);
    const housing = housingIdentity(regionCode);
    return {
      investment:{
        key:'investment', title:investment.toolName,
        desc:isIndia(regionCode)
          ? 'Model SIP future value, calculate a SIP required for a goal, compare step-up SIP with fixed SIP, or estimate time to a target corpus.'
          : 'Model recurring investment growth, calculate the contribution required for a goal, compare increasing contributions with a fixed contribution, or estimate time to a target.',
        url:'carrowmont.com/sip-calculator/'
      },
      retirement:{ key:'retirement', title:'Retirement Planner', desc:'Model retirement spending, income, current savings and the amount that may be required for the retirement lifestyle you enter.', url:'carrowmont.com/retirement-calculator/' },
      goal:{ key:'goal', title:'Goal Planner', desc:'Plan for education, a home, travel, emergency savings and other financial goals using future-cost and investment assumptions.', url:'carrowmont.com/goal-planner/' },
      fi:{ key:'fi', title:'Financial Independence', desc:'Estimate a spending-based financial-independence target and compare it with your current investment path and target age.', url:'carrowmont.com/financial-independence/' },
      inflation:{ key:'inflation', title:'Inflation Calculator', desc:'See how inflation may change future costs and purchasing power across different time horizons and currencies.', url:'carrowmont.com/inflation-calculator/' },
      budget:{ key:'budget', title:'Budget & Cash Flow Planner', desc:'Organize income, bills, irregular expenses, emergency reserves and safe-to-spend cash flow around the way you are actually paid.', url:'carrowmont.com/budget-cash-flow-planner/' },
      housing:{ key:'housing', title:housing.title, desc:housing.desc, url:'carrowmont.com/mortgage-payoff-calculator/' },
      compound:{ key:'compound', title:'Compound Interest Calculator', desc:'See how a starting amount can change under a stated rate, compounding frequency and time horizon, with optional regular contributions.', url:'carrowmont.com/compound-interest-calculator/' }
    };
  }

  function footer(ctx, right='Financial Planning, Tools & Learning · carrowmont.com'){
    P().text(ctx,'CARROWMONT',M,H-36,{size:9.8,weight:900,color:C.teal});
    P().text(ctx,right,W-M,H-36,{size:8.8,weight:500,color:C.muted,align:'right'});
  }

  function sectionTitle(ctx,title,y){
    P().text(ctx,title,M,y,{size:15.5,weight:900,color:C.ink});
    hline(ctx,M,W-M,y+13,'#c7d3da',1);
    return y+28;
  }

  function lineCount(ctx,text,maxWidth,size=9.2,weight=500){
    ctx.font=`${weight} ${size}px Arial, sans-serif`;
    let count=0;
    String(text ?? '').split(/\n/).forEach(para => {
      const words=para.trim().split(/\s+/).filter(Boolean);
      if(!words.length){ count++; return; }
      let line=words[0];
      for(let i=1;i<words.length;i++){
        const next=`${line} ${words[i]}`;
        if(ctx.measureText(next).width<=maxWidth) line=next;
        else { count++; line=words[i]; }
      }
      count++;
    });
    return Math.max(1,count);
  }

  function infoRows(ctx,items,y,opt={}){
    const labelW=opt.labelW||170, bodyX=M+labelW+16, bodyW=CW-labelW-24;
    const labelSize=opt.labelSize||9.1, bodySize=opt.bodySize||9.15, lineHeight=opt.lineHeight||12.2;
    items.forEach((item,idx)=>{
      const label=Array.isArray(item)?item[0]:item.label;
      const body=Array.isArray(item)?item[1]:item.body;
      const labelLines=lineCount(ctx,label,labelW-14,labelSize,850);
      const bodyLines=lineCount(ctx,body,bodyW,bodySize,500);
      const rowH=Math.max(34, 15 + Math.max(labelLines*11.3,bodyLines*lineHeight));
      if(idx%2===1){ ctx.fillStyle='#fbfdfe'; ctx.fillRect(M,y,CW,rowH); }
      P().wrappedText(ctx,label,M+7,y+18,labelW-14,{size:labelSize,lineHeight:11.3,weight:850,color:C.ink,maxLines:4});
      P().wrappedText(ctx,body,bodyX,y+18,bodyW,{size:bodySize,lineHeight,weight:500,color:C.muted,maxLines:5});
      hline(ctx,M,W-M,y+rowH,C.line,1);
      y+=rowH;
    });
    return y;
  }

  function columnRows(ctx,items,x,y,w,opt={}){
    const labelSize=opt.labelSize||8.9, bodySize=opt.bodySize||8.8, bodyLine=opt.bodyLine||11.2;
    items.forEach((item,idx)=>{
      const label=Array.isArray(item)?item[0]:item.label;
      const body=Array.isArray(item)?item[1]:item.body;
      const labelLines=lineCount(ctx,label,w-20,labelSize,850);
      const bodyLines=lineCount(ctx,body,w-20,bodySize,500);
      const rowH=Math.max(46,18+labelLines*10.6+bodyLines*bodyLine);
      if(idx%2===1){ ctx.fillStyle='#fbfdfe'; ctx.fillRect(x,y,w,rowH); }
      P().wrappedText(ctx,label,x+10,y+16,w-20,{size:labelSize,lineHeight:10.6,weight:850,color:C.ink,maxLines:2});
      P().wrappedText(ctx,body,x+10,y+18+labelLines*10.6,w-20,{size:bodySize,lineHeight:bodyLine,weight:500,color:C.muted,maxLines:4});
      hline(ctx,x,x+w,y+rowH,C.line,1);
      y+=rowH;
    });
    return y;
  }

  function guidePage(config={}){
    const pg=page(),ctx=pg.ctx;
    const reportTitle=config.reportTitle||'Carrowmont Planning Report';
    const preparedFrom=config.preparedFrom||'';
    P().text(ctx,'CARROWMONT',M,50,{size:14,weight:900,color:C.teal});
    P().text(ctx,'Report Guide & Methodology',M,88,{size:26,weight:900,color:C.ink});
    P().text(ctx,reportTitle,M,112,{size:11,weight:800,color:C.tealDark});
    if(preparedFrom) P().text(ctx,preparedFrom,W-M,50,{size:9.5,weight:650,color:C.muted,align:'right'});
    P().text(ctx,'Educational planning report',W-M,70,{size:9.2,weight:500,color:C.muted,align:'right'});
    hline(ctx,M,W-M,136,C.navy,2);

    let y=166;
    y=sectionTitle(ctx,'How to read this report',y);
    const howText=config.howToRead||'Read the headline result first, then review the assumptions, supporting tables and charts. Values are modelled estimates based on the information entered and should be interpreted together rather than as guaranteed outcomes.';
    const howLines=lineCount(ctx,howText,CW-28,10.1,650), howH=Math.max(52,22+howLines*14);
    card(ctx,M,y,CW,howH,C.pale,'#b8ddd8',10);
    P().wrappedText(ctx,howText,M+14,y+18,CW-28,{size:10.1,lineHeight:14,weight:650,color:C.ink,maxLines:4});
    y+=howH+20;

    const gap=16,colW=(CW-gap)/2,leftX=M,rightX=M+colW+gap;
    P().text(ctx,'Methodology',leftX,y,{size:15.2,weight:900,color:C.ink});
    P().text(ctx,'Terminology used in this report',rightX,y,{size:15.2,weight:900,color:C.ink});
    hline(ctx,leftX,leftX+colW,y+13,'#c7d3da',1);
    hline(ctx,rightX,rightX+colW,y+13,'#c7d3da',1);
    const rowStart=y+28;
    card(ctx,leftX,rowStart,colW,1,C.white,C.line,9);
    card(ctx,rightX,rowStart,colW,1,C.white,C.line,9);
    const leftEnd=columnRows(ctx,config.methodology||[],leftX,rowStart,colW);
    const rightEnd=columnRows(ctx,config.terminology||[],rightX,rowStart,colW);
    y=Math.max(leftEnd,rightEnd)+20;

    y=sectionTitle(ctx,'Important assumptions & disclaimer',y);
    const disclaimer=config.disclaimer||'This report is an educational planning illustration based on the information and assumptions entered. It is not individualized investment, financial, tax, legal, accounting or insurance advice. Actual outcomes can differ materially.';
    const assumptions=config.assumptions||'';
    const dText=assumptions?`${assumptions} ${disclaimer}`:disclaimer;
    const dLines=lineCount(ctx,dText,CW-28,9.0,550), dH=Math.max(72,28+dLines*11.8);
    card(ctx,M,y,CW,dH,C.note,C.line,10);
    P().wrappedText(ctx,dText,M+14,y+23,CW-28,{size:9.0,lineHeight:11.8,weight:550,color:C.ink,maxLines:7});
    y+=dH+14;

    const metaH=76;
    if(y+metaH>H-54) y=H-54-metaH;
    card(ctx,M,y,CW,metaH,C.white,C.line,10);
    P().text(ctx,'Methodology & contact',M+14,y+23,{size:12.2,weight:900,color:C.tealDark});
    const methodText=config.methodologyMeta||'Current Carrowmont methodology';
    P().text(ctx,`Methodology: ${methodText}`,M+14,y+44,{size:8.7,weight:650,color:C.muted});
    if(config.methodologyUrl) P().text(ctx,String(config.methodologyUrl).replace(/^https?:\/\//,''),M+14,y+62,{size:8.5,weight:500,color:C.muted});
    P().text(ctx,`Contact: ${config.contact||'contact@carrowmont.com'}`,W-M-14,y+62,{size:8.5,weight:650,color:C.muted,align:'right'});
    footer(ctx,'Report Guide & Methodology · carrowmont.com');
    return pg.canvas;
  }

  function continuePlanningPage(config={}){
    const pg=page(),ctx=pg.ctx;
    const currentTool=config.currentTool||'';
    const inv=investmentIdentity();
    const catalog=toolCatalog();
    const tools=Object.values(catalog).filter(t=>t.key!==currentTool);
    P().text(ctx,'CARROWMONT',M,58,{size:15,weight:900,color:C.teal});
    P().text(ctx,'Continue planning with Carrowmont',M,101,{size:27,weight:900,color:C.ink});
    const intro=config.intro || `This calculation is one part of a broader financial plan. Explore ${inv.planningPhrase}, compound growth, retirement, life goals, financial independence, inflation, housing debt and day-to-day cash flow with Carrowmont.`;
    P().wrappedText(ctx,intro,M,130,CW,{size:11,lineHeight:16,weight:500,color:C.muted,maxLines:3});
    hline(ctx,M,W-M,178,C.navy,2);
    const gapX=16,gapY=14,cw=(CW-gapX)/2,ch=142,gridTop=204;
    const rows=Math.ceil(tools.length/2);
    tools.forEach((t,i)=>{
      const row=Math.floor(i/2);
      const isLastOdd=tools.length%2===1 && i===tools.length-1;
      const col=i%2;
      const x=isLastOdd ? M+(CW-cw)/2 : M+col*(cw+gapX);
      const y=gridTop+row*(ch+gapY);
      card(ctx,x,y,cw,ch,C.white,C.line,13);
      P().text(ctx,t.title,x+16,y+29,{size:13.8,weight:900,color:C.ink});
      P().wrappedText(ctx,t.desc,x+16,y+52,cw-32,{size:9.1,lineHeight:12.3,weight:500,color:C.muted,maxLines:4});
      P().text(ctx,t.url,x+16,y+121,{size:8.9,weight:800,color:C.tealDark});
    });
    const afterGrid=gridTop+rows*ch+Math.max(0,rows-1)*gapY;
    const promoY=afterGrid+30;
    card(ctx,M,promoY,CW,92,C.pale,'#b8ddd8',12);
    P().text(ctx,'Explore all Carrowmont tools',M+16,promoY+30,{size:14,weight:900,color:C.tealDark});
    P().wrappedText(ctx,'Visit carrowmont.com to continue your planning. Carrowmont tools are educational illustrations and do not guarantee financial or investment outcomes.',M+16,promoY+55,CW-32,{size:9.7,lineHeight:13.5,weight:500,color:C.ink,maxLines:3});
    footer(ctx);
    return pg.canvas;
  }

  window.CarrowmontReportStandard={
    investmentIdentity,
    housingIdentity,
    toolCatalog,
    guidePage,
    continuePlanningPage,
    isIndia,
    region
  };
})();
