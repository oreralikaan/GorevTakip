const input = document.getElementById("gorevInput");
const ekleBtn = document.getElementById("ekleBtn");
const liste = document.getElementById("gorevListesi");
const aramaInput = document.getElementById("aramaInput");
const filtreSelect = document.getElementById("filtreSelect");
const bosMesaj = document.getElementById("bosMesaj");
const temaBtn = document.getElementById("temaBtn");
const temaIcon = document.getElementById("temaIcon");

let gorevler = [];
const KEY = "gorevler_v1";
const THEME_KEY = "tema_modu";
let _editingId = null; // aynı anda tek satır düzenlensin

// Türkçe uyumlu arama normalizasyonu
function trFold(s) {
  if (!s) return "";
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("i̇", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u");
}

// localStorage
function kaydet(){ localStorage.setItem(KEY, JSON.stringify(gorevler)); }
function yukle(){
  try{
    const ham = localStorage.getItem(KEY);
    gorevler = Array.isArray(JSON.parse(ham)) ? JSON.parse(ham) : [];
  }catch{ gorevler = []; }
}

// CRUD
function gorevEkle(metin){
  const temiz = (metin || "").trim().replace(/\s+/g, " ");
  if(!temiz) return;
  gorevler.push({ id: Date.now(), metin: temiz, tamamlandi: false });
  kaydet(); render();
}
function gorevSil(id){
  gorevler = gorevler.filter(g => g.id !== id);
  kaydet(); render();
}
function gorevToggle(id, durum){
  const g = gorevler.find(x => x.id === id);
  if(g) g.tamamlandi = durum;
  kaydet(); render();
}

// Filtre + arama
function filtreleVeAra(kaynak){
  const mod = filtreSelect?.value || "all"; // all | done | todo
  const q = trFold(aramaInput?.value || "");
  return kaynak.filter(g => {
    if(mod === "done" && !g.tamamlandi) return false;
    if(mod === "todo" && g.tamamlandi) return false;
    if(q && !trFold(g.metin).includes(q)) return false;
    return true;
  });
}

// --- DÜZENLEME MODU ---
function duzenlemeBaslat(id){
  // Açık başka düzenleme varsa önce ekrana taze çiz
  if(_editingId && _editingId !== id) render();
  _editingId = id;

  // HATA DÜZELTİLDİ: querySelector tırnakları eklendi
  const li = liste.querySelector(`li[data-id="${id}"]`);
  if(!li) return;

  const span = li.querySelector(".task-text");
  const eskiMetin = span?.textContent || "";

  // Metin yerine input koy
  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = eskiMetin;
  inp.className = "form-control form-control-sm flex-grow-1";
  span.replaceWith(inp);
  inp.focus(); inp.select();

  // Düzenle butonunu gizle, Kaydet/İptal ekle
  const duzenleBtn = li.querySelector(".btn-edit");
  const silBtn = li.querySelector(".btn-delete");
  if(duzenleBtn) duzenleBtn.style.display = "none";

  const kaydetBtn = document.createElement("button");
  kaydetBtn.className = "btn btn-success btn-sm ms-2 btn-save";
  kaydetBtn.innerHTML = '<i class="bi bi-check"></i>';

  const iptalBtn = document.createElement("button");
  iptalBtn.className = "btn btn-secondary btn-sm ms-2 btn-cancel";
  iptalBtn.innerHTML = '<i class="bi bi-x"></i>';

  // Sil butonunun hemen sağına yerleştir
  if(silBtn){
    silBtn.after(kaydetBtn);
    kaydetBtn.after(iptalBtn);
  }else{
    li.append(kaydetBtn, iptalBtn);
  }

  const bitir = (kaydetFlag) => {
    if(kaydetFlag){
      const yeni = inp.value.trim().replace(/\s+/g, " ");
      if(yeni){
        const g = gorevler.find(x => x.id === id);
        if(g) g.metin = yeni;
        kaydet();
      }
    }
    _editingId = null;
    render();
  };

  kaydetBtn.addEventListener("click", () => bitir(true));
  iptalBtn.addEventListener("click", () => bitir(false));
  inp.addEventListener("keydown", (e) => {
    if(e.key === "Enter") bitir(true);
    else if(e.key === "Escape") bitir(false);
  });
}

// Çizim
function render(){
  const gosterilecek = filtreleVeAra(gorevler);
  liste.innerHTML = "";
  if(bosMesaj) bosMesaj.style.display = gosterilecek.length ? "none" : "block";

  for(const g of gosterilecek){
    const li = document.createElement("li");
    li.className = "list-group-item task-item d-flex align-items-center";
    li.dataset.id = String(g.id);

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "form-check-input me-3";
    cb.checked = g.tamamlandi;
    cb.addEventListener("change", () => gorevToggle(g.id, cb.checked));

    const span = document.createElement("span");
    span.className = "task-text flex-grow-1";
    span.textContent = g.metin;
    if(g.tamamlandi) span.classList.add("done");

    const duzenleBtn = document.createElement("button");
    duzenleBtn.className = "btn btn-outline-secondary btn-sm ms-2 btn-edit";
    duzenleBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    duzenleBtn.addEventListener("click", () => duzenlemeBaslat(g.id));

    const silBtn = document.createElement("button");
    silBtn.className = "btn btn-outline-danger btn-sm ms-2 btn-delete";
    silBtn.innerHTML = '<i class="bi bi-trash"></i>';
    silBtn.addEventListener("click", () => gorevSil(g.id));

    li.append(cb, span, duzenleBtn, silBtn);
    liste.appendChild(li);
  }

  // Eğer bir satır düzenleniyorsa yeniden düzenleme moduna sok
  if(_editingId){
    const varMi = gorevler.some(x => x.id === _editingId);
    if(varMi) duzenlemeBaslat(_editingId);
    else _editingId = null;
  }
}

// Tema
function temaYukle(){
  const kayitli = localStorage.getItem(THEME_KEY) || "light";
  document.body.classList.remove("light","dark");
  document.body.classList.add(kayitli);
  if(temaIcon) temaIcon.className = kayitli === "light" ? "bi bi-moon fs-5" : "bi bi-sun fs-5";
}
temaBtn?.addEventListener("click", () => {
  const yeni = document.body.classList.contains("light") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, yeni);
  temaYukle();
});

// Olaylar
ekleBtn?.addEventListener("click", () => {
  gorevEkle(input.value);
  input.value=""; input.focus();
});
input?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    gorevEkle(input.value);
    input.value="";
  }
});
aramaInput?.addEventListener("input", render);
filtreSelect?.addEventListener("change", render);

// Sekmeler arası senkron
window.addEventListener("storage", (e) => {
  if(e.key === KEY){ yukle(); render(); }
  if(e.key === THEME_KEY){ temaYukle(); }
});

// Başlat
window.addEventListener("DOMContentLoaded", () => { yukle(); temaYukle(); render(); });
