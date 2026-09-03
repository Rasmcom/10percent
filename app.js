(() => {
  "use strict";
  const PROGRAMS=window.ACTIVITY_PROGRAMS||[];
  const stageEl=document.getElementById("stage");
  const programEl=document.getElementById("program");
  const fieldEl=document.getElementById("field");
  const sessionsEl=document.getElementById("sessions");
  const gradeEl=document.getElementById("grade");
  const sourceNote=document.getElementById("sourceNote");
  const eduAdmin=document.getElementById("eduAdmin");
  const otherAdminWrap=document.getElementById("otherAdminWrap");
  const programKindTabs=[...document.querySelectorAll(".program-kind-tab")];
  let programKind="classroom";

  const gradeMap={
    initial:["الصف الأول الابتدائي","الصف الثاني الابتدائي","الصف الثالث الابتدائي"],
    upper:["الصف الرابع الابتدائي","الصف الخامس الابتدائي","الصف السادس الابتدائي"],
    middle:["الصف الأول المتوسط","الصف الثاني المتوسط","الصف الثالث المتوسط"],
    secondary:["الصف الأول الثانوي","الصف الثاني الثانوي","الصف الثالث الثانوي"]
  };
  const days=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"];
  const hijriMonths=["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];

  const ARABIC_DIGITS="٠١٢٣٤٥٦٧٨٩";
  const toArabicDigits=value=>String(value??"").replace(/\d/g,d=>ARABIC_DIGITS[Number(d)]);
  const option=(value,text)=>{const o=document.createElement("option");o.value=value;o.textContent=toArabicDigits(text??value);return o;};
  const NONCLASS_SESSION_STORAGE_KEY="rasm_activity_nonclass_sessions_v1";
  function readNonclassSessions(){
    try{return JSON.parse(localStorage.getItem(NONCLASS_SESSION_STORAGE_KEY)||"{}")||{}}catch(e){return{}}
  }
  function nonclassSessionKey(programId,stage){return `${stage||""}|${programId||""}`;}
  function savedNonclassSessions(programId,stage){
    const value=Number(readNonclassSessions()[nonclassSessionKey(programId,stage)]);
    return value>=1&&value<=50?String(value):"1";
  }
  function saveNonclassSessions(programId,stage,value){
    const n=Math.max(1,Math.min(50,Number(value)||1));
    try{
      const data=readNonclassSessions();data[nonclassSessionKey(programId,stage)]=n;
      localStorage.setItem(NONCLASS_SESSION_STORAGE_KEY,JSON.stringify(data));
    }catch(e){console.warn("تعذر حفظ عدد حصص الفترة اللاصفية",e);}
  }
  function fillEditableNonclassSessions(selected="1"){
    sessionsEl.innerHTML="";
    for(let i=1;i<=50;i++)sessionsEl.appendChild(option(String(i),i));
    sessionsEl.disabled=false;
    sessionsEl.value=[...sessionsEl.options].some(o=>o.value===String(selected))?String(selected):"1";
  }

  function fillSimpleSelect(el, placeholder, values){
    el.innerHTML="";
    el.appendChild(option("",placeholder));
    values.forEach(v=>el.appendChild(option(String(v),v)));
  }

  document.querySelectorAll(".day-select").forEach(el=>fillSimpleSelect(el,"اختر",days));
  document.querySelectorAll(".week-select").forEach(el=>fillSimpleSelect(el,"اختر",Array.from({length:19},(_,i)=>i+1)));
  fillSimpleSelect(document.getElementById("disabilityCount"),"اختر العدد",Array.from({length:51},(_,i)=>i));
  fillSimpleSelect(document.getElementById("parentCount"),"اختر العدد",Array.from({length:51},(_,i)=>i));
  fillSimpleSelect(document.getElementById("partnershipCount"),"اختر العدد",Array.from({length:21},(_,i)=>i));

  function buildHijriDate(containerId){
    const wrap=document.getElementById(containerId);
    wrap.innerHTML="";
    const d=document.createElement("select"),m=document.createElement("select"),y=document.createElement("select");
    d.className=m.className=y.className="control";
    d.setAttribute("aria-label","اليوم الهجري");m.setAttribute("aria-label","الشهر الهجري");y.setAttribute("aria-label","السنة الهجرية");
    fillSimpleSelect(d,"يوم",Array.from({length:30},(_,i)=>i+1));
    fillSimpleSelect(m,"شهر",Array.from({length:12},(_,i)=>i+1));
    fillSimpleSelect(y,"سنة",[1448,1449,1450]);
    y.value="1448";
    wrap.append(d,m,y);
  }
  ["startDate","endDate","teacherSignDate","leaderSignDate"].forEach(buildHijriDate);

  function rebuildPrograms(){
    const stage=stageEl.value;
    programEl.innerHTML="";
    fieldEl.innerHTML="";
    sessionsEl.innerHTML="";
    sessionsEl.disabled=true;
    sourceNote.textContent="";
    if(!stage){
      programEl.disabled=true;
      programEl.appendChild(option("","اختر المرحلة أولًا"));
      fieldEl.appendChild(option("","يُحدد تلقائيًا من البرنامج"));
      sessionsEl.appendChild(option("","يُحدد تلقائيًا من ملف البرامج"));
      gradeEl.disabled=true;gradeEl.innerHTML="";gradeEl.appendChild(option("","اختر المرحلة أولًا"));
      return;
    }
    const available=PROGRAMS.filter(p=>{
      if(Number(p[stage])<=0)return false;
      const isNonClass=p.field==="الفترات اللاصفية";
      return programKind==="nonclass"?isNonClass:!isNonClass;
    });
    const groups=new Map();
    available.forEach(p=>{ if(!groups.has(p.field)) groups.set(p.field,[]); groups.get(p.field).push(p); });
    programEl.appendChild(option("",programKind==="nonclass"?"اختر برنامج الفترة اللاصفية":"اختر اسم البرنامج"));
    for(const [field,items] of groups){
      const g=document.createElement("optgroup");g.label=field;
      items.forEach(p=>{ const o=option(String(p.id),p.program);o.dataset.field=p.field;o.dataset.sessions=p[stage];o.dataset.note=p.note||"";g.appendChild(o); });
      programEl.appendChild(g);
    }
    programEl.disabled=false;
    fieldEl.appendChild(option("","يُحدد تلقائيًا من البرنامج"));
    sessionsEl.appendChild(option("",programKind==="nonclass"?"يبدأ من ١ ويمكن تعديله":"يُحدد تلقائيًا من ملف البرامج"));

    gradeEl.innerHTML="";gradeEl.appendChild(option("","اختر الصف"));
    gradeMap[stage].forEach(g=>gradeEl.appendChild(option(g,g)));
    gradeEl.disabled=false;
  }

  function syncProgram(){
    const id=Number(programEl.value);
    const p=PROGRAMS.find(x=>x.id===id);
    fieldEl.innerHTML="";sessionsEl.innerHTML="";
    if(!p){
      fieldEl.appendChild(option("","يُحدد تلقائيًا من البرنامج"));
      sessionsEl.appendChild(option("",programKind==="nonclass"?"يبدأ من ١ ويمكن تعديله":"يُحدد تلقائيًا من ملف البرامج"));
      sessionsEl.disabled=true;
      sourceNote.textContent="";
      return;
    }
    fieldEl.appendChild(option(p.field,p.field));fieldEl.value=p.field;
    if(programKind==="nonclass"){
      fillEditableNonclassSessions(savedNonclassSessions(p.id,stageEl.value));
    }else{
      const n=p[stageEl.value];
      sessionsEl.appendChild(option(String(n),n));sessionsEl.value=String(n);sessionsEl.disabled=true;
    }
    sourceNote.textContent=p.note ? toArabicDigits("ملاحظة الدليل: "+p.note) : "";
  }

  function setProgramKind(kind){
    programKind=kind==="nonclass"?"nonclass":"classroom";
    programKindTabs.forEach(btn=>{
      const active=btn.dataset.programKind===programKind;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",active?"true":"false");
    });
    rebuildPrograms();
  }
  programKindTabs.forEach(btn=>btn.addEventListener("click",()=>setProgramKind(btn.dataset.programKind)));
  stageEl.addEventListener("change",()=>{rebuildPrograms();});
  programEl.addEventListener("change",syncProgram);
  sessionsEl.addEventListener("change",()=>{
    if(programKind!=="nonclass"||!programEl.value)return;
    saveNonclassSessions(programEl.value,stageEl.value,sessionsEl.value);
  });
  eduAdmin.addEventListener("change",()=>{otherAdminWrap.style.display=eduAdmin.value==="أخرى"?"grid":"none";});

  const teacherName=document.getElementById("teacherName");
  const teacherSignName=document.getElementById("teacherSignName");
  let signNameEdited=false;
  teacherName.addEventListener("input",()=>{if(!signNameEdited) teacherSignName.value=teacherName.value;});
  teacherSignName.addEventListener("input",()=>{signNameEdited=true;});

  // تحويل ما يكتبه المستخدم في خانة عدد الطلبة إلى أرقام عربية.
  const studentCount=document.getElementById("studentCount");
  studentCount.addEventListener("input",()=>{
    const caret=studentCount.selectionStart;
    studentCount.value=studentCount.value.replace(/[0-9]/g,d=>ARABIC_DIGITS[Number(d)]).replace(/[^٠-٩]/g,"");
    try{studentCount.setSelectionRange(caret,caret);}catch(e){}
  });

  // اختيار متعدد لأيقونات منصة مدرستي: تظهر الخيارات الأربعة دائمًا.
  const madrasatiChecks=[...document.querySelectorAll('#madrasatiPanel input[type="checkbox"]')];
  function syncMadrasati(){
    madrasatiChecks.forEach(c=>c.closest(".multi-inline-option")?.classList.toggle("selected",c.checked));
  }
  madrasatiChecks.forEach(c=>c.addEventListener("change",syncMadrasati));

  // نافذة التوقيع: الرسم أزرق، ثم اعتماد وإظهاره في البطاقة.
  const signatureModal=document.getElementById("signatureModal");
  const signatureCanvas=document.getElementById("signaturePad");
  const signatureCtx=signatureCanvas.getContext("2d");
  let activeSignatureId=null,drawing=false,lastPoint=null,hasInk=false;
  const approvedSignatures=new Map();

  function resizeSignaturePad(){
    const rect=signatureCanvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    signatureCanvas.width=Math.round(rect.width*dpr);
    signatureCanvas.height=Math.round(rect.height*dpr);
    signatureCtx.setTransform(dpr,0,0,dpr,0,0);
    signatureCtx.strokeStyle="#1565c0";
    signatureCtx.lineWidth=3.2;
    signatureCtx.lineCap="round";
    signatureCtx.lineJoin="round";
    hasInk=false;
  }
  function clearPad(){signatureCtx.clearRect(0,0,signatureCanvas.width,signatureCanvas.height);hasInk=false;}
  function sigPoint(e){const r=signatureCanvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  signatureCanvas.addEventListener("pointerdown",e=>{drawing=true;lastPoint=sigPoint(e);signatureCanvas.setPointerCapture?.(e.pointerId);});
  signatureCanvas.addEventListener("pointermove",e=>{
    if(!drawing)return;
    const p=sigPoint(e);signatureCtx.beginPath();signatureCtx.moveTo(lastPoint.x,lastPoint.y);signatureCtx.lineTo(p.x,p.y);signatureCtx.stroke();lastPoint=p;hasInk=true;
  });
  const stopSignature=()=>{drawing=false;lastPoint=null;};
  signatureCanvas.addEventListener("pointerup",stopSignature);
  signatureCanvas.addEventListener("pointercancel",stopSignature);

  function signatureButton(id){return document.querySelector(`.signature-click[data-signature="${id}"]`);}
  function showApprovedSignature(id,dataUrl){
    const btn=signatureButton(id);if(!btn)return;
    btn.querySelector("img").src=dataUrl;btn.classList.add("has-signature");approvedSignatures.set(id,dataUrl);
  }
  function removeApproved(id){
    const btn=signatureButton(id);if(!btn)return;
    btn.classList.remove("has-signature");btn.querySelector("img").removeAttribute("src");approvedSignatures.delete(id);
  }
  function openSignature(id){
    activeSignatureId=id;signatureModal.classList.add("open");document.body.style.overflow="hidden";
    requestAnimationFrame(()=>{resizeSignaturePad();clearPad();});
  }
  function closeSignature(){signatureModal.classList.remove("open");document.body.style.overflow="";activeSignatureId=null;clearPad();}
  document.querySelectorAll(".signature-click").forEach(btn=>btn.addEventListener("click",()=>openSignature(btn.dataset.signature)));
  document.getElementById("clearSignaturePad").addEventListener("click",clearPad);
  document.getElementById("cancelSignature").addEventListener("click",closeSignature);
  document.getElementById("removeApprovedSignature").addEventListener("click",()=>{if(activeSignatureId)removeApproved(activeSignatureId);closeSignature();});
  document.getElementById("approveSignature").addEventListener("click",()=>{
    if(!activeSignatureId)return;
    if(!hasInk){alert("فضلاً أضف التوقيع أولًا.");return;}
    showApprovedSignature(activeSignatureId,signatureCanvas.toDataURL("image/png"));closeSignature();
  });
  signatureModal.addEventListener("click",e=>{if(e.target===signatureModal)closeSignature();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&signatureModal.classList.contains("open"))closeSignature();});
  window.addEventListener("resize",()=>{if(signatureModal.classList.contains("open"))resizeSignaturePad();});

  const MOE_LOGO_DATA_URI="logomoe.svg";
  function syncNativePrintHeader(){
    const admin=currentAdminName()||"الإدارة التعليمية";
    const school=(document.getElementById("schoolName")?.value||"").trim()||"اسم المدرسة";
    const a=document.getElementById("nativePrintAdmin"),s=document.getElementById("nativePrintSchool");
    if(a)a.textContent=admin;if(s)s.textContent=school;
  }
  function currentAdminName(){
    if(eduAdmin.value==="أخرى") return (document.getElementById("otherAdmin")?.value||"").trim();
    return (eduAdmin.value||"").trim();
  }
  function printDateValue(container){
    const vals=[...container.querySelectorAll("select")].map(s=>s.value);
    return vals.every(Boolean)?vals.map(toArabicDigits).join(" / "):"";
  }
  function copyLiveFormState(source,clone){
    const sourceControls=[...source.querySelectorAll("input,select,textarea")];
    const cloneControls=[...clone.querySelectorAll("input,select,textarea")];
    sourceControls.forEach((el,i)=>{
      const c=cloneControls[i];if(!c)return;
      if(el.type==="checkbox"||el.type==="radio")c.checked=el.checked;else c.value=el.value;
    });
  }
  function staticSpan(text,alignRight=false){
    const span=document.createElement("span");span.className="static-value"+(alignRight?" text-right":"");span.textContent=text||"";return span;
  }
  function buildPrintCard(){
    const source=document.getElementById("sheet");
    const clone=source.cloneNode(true);copyLiveFormState(source,clone);
    clone.removeAttribute("id");clone.className="print-card-clone";
    clone.querySelector(".identity")?.remove();
    clone.querySelector(".program-kind-tabs")?.remove();
    clone.querySelector("#nativePrintHeader")?.remove();
    const header=document.createElement("header");header.className="print-header-compact";
    const admin=currentAdminName()||"الإدارة التعليمية",school=(document.getElementById("schoolName")?.value||"").trim()||"اسم المدرسة";
    header.innerHTML=`<div class="print-brand-row"><div class="print-logo-mark"><img src="${MOE_LOGO_DATA_URI}" alt="شعار وزارة التعليم"></div><div class="print-school-lines"><span class="edu-line">${admin.replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}</span><span class="school-line">${school.replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}</span></div></div>`;
    clone.insertBefore(header,clone.firstChild);
    const title=clone.querySelector(".title");if(title)title.textContent="بطاقة تنفيذ برنامج نشاط طلابي*";

    ["startDate","endDate","teacherSignDate","leaderSignDate"].forEach(id=>{
      const original=document.getElementById(id),target=clone.querySelector(`#${id}`);if(!original||!target)return;
      const span=document.createElement("span");span.className="numeric-date";span.textContent=printDateValue(original);target.replaceWith(span);
    });

    const semesterTarget=clone.querySelector("#semesterOptions");
    if(semesterTarget){
      const selected=document.querySelector('input[name="semester"]:checked')?.value||"";
      semesterTarget.className="semester-print-options";
      semesterTarget.innerHTML=`<span class="print-choice">${selected==="الأول"?"☑":"☐"} الأول</span><span class="print-choice">${selected==="الثاني"?"☑":"☐"} الثاني</span>`;
    }

    const madrasatiTarget=clone.querySelector("#madrasatiPanel");
    if(madrasatiTarget){
      const selected=new Set(madrasatiChecks.filter(c=>c.checked).map(c=>c.value));
      const all=["بنك الإثراءات","التطوير الذاتي","قيمنا الغالية","نادي القراءة"];
      madrasatiTarget.className="madrasati-print-options";
      madrasatiTarget.innerHTML=all.map(v=>`<span class="print-choice">${selected.has(v)?"☑":"☐"} ${v}</span>`).join("");
    }

    clone.querySelectorAll("select").forEach(el=>{
      const txt=el.selectedOptions?.[0]?.textContent||"";el.replaceWith(staticSpan(txt));
    });
    clone.querySelectorAll('input[type="text"]').forEach(el=>el.replaceWith(staticSpan(el.value,el.classList.contains("sig-input")||el.id==="teacherName"||el.id==="partnershipNames")));
    clone.querySelectorAll("textarea").forEach(el=>el.replaceWith(staticSpan(el.value,true)));
    clone.querySelectorAll('input[type="checkbox"],input[type="radio"]').forEach(el=>el.remove());
    clone.querySelectorAll(".signature-click").forEach(btn=>{
      const box=document.createElement("div");box.className="print-signature-box";const img=btn.querySelector("img");
      if(btn.classList.contains("has-signature")&&img?.getAttribute("src")){const out=document.createElement("img");out.src=img.src;out.alt=img.alt||"التوقيع";box.appendChild(out)}
      btn.replaceWith(box);
    });
    clone.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
    return clone;
  }
  function waitForImages(root){
    return Promise.all([...root.querySelectorAll("img")].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve})));
  }
  async function downloadActivityCardPdf(){
    const preview=document.getElementById("pdfPreview");preview.innerHTML="";
    const page=document.createElement("div");page.className="print-page";page.appendChild(buildPrintCard());preview.appendChild(page);
    preview.classList.add("pdf-capture");
    try{
      if(document.fonts?.ready)await document.fonts.ready;await waitForImages(page);
      if(typeof html2canvas==="undefined"||!window.jspdf)throw new Error("تعذر تحميل مكتبات PDF");
      const rendered=await html2canvas(page,{scale:Math.max(2,window.devicePixelRatio||1),useCORS:true,allowTaint:true,backgroundColor:"#fff",logging:false,windowWidth:page.scrollWidth,windowHeight:page.scrollHeight,scrollX:0,scrollY:0});
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
      pdf.addImage(rendered.toDataURL("image/jpeg",.97),"JPEG",0,0,210,297,undefined,"FAST");
      pdf.save("بطاقة-تنفيذ-برنامج-نشاط.pdf");
    }catch(e){
      console.error(e);syncNativePrintHeader();alert("تعذر توليد PDF تلقائيًا؛ سيتم فتح نافذة الطباعة بدلًا من ذلك.");window.print();
    }finally{preview.classList.remove("pdf-capture");preview.innerHTML="";}
  }
  [eduAdmin,document.getElementById("otherAdmin"),document.getElementById("schoolName")].filter(Boolean).forEach(el=>{el.addEventListener("input",syncNativePrintHeader);el.addEventListener("change",syncNativePrintHeader)});
  window.addEventListener("beforeprint",syncNativePrintHeader);
  syncNativePrintHeader();
  document.getElementById("printBtn").addEventListener("click",()=>{syncNativePrintHeader();downloadActivityCardPdf();});
  document.getElementById("resetBtn").addEventListener("click",()=>{
    if(!confirm("هل تريد مسح جميع بيانات البطاقة والتواقيع؟"))return;
    document.querySelectorAll('input[type="text"],textarea').forEach(el=>el.value="");
    document.querySelectorAll("select").forEach(el=>{if(!el.disabled)el.selectedIndex=0;});
    madrasatiChecks.forEach(c=>c.checked=false);syncMadrasati();document.querySelectorAll('input[name="semester"]').forEach(r=>r.checked=false);
    document.getElementById("otherAdminWrap").style.display="none";
    signNameEdited=false;sourceNote.textContent="";
    removeApproved("teacherSignature");removeApproved("leaderSignature");
    stageEl.value="";setProgramKind("classroom");
    ["startDate","endDate","teacherSignDate","leaderSignDate"].forEach(id=>{
      const sels=document.getElementById(id).querySelectorAll("select");
      sels.forEach((s,i)=>{s.selectedIndex=i===2?1:0;});
    });
  });

  rebuildPrograms();
})();