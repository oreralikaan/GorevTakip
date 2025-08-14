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
//localStorage bilgileri kayıt altına alar
//Neden önemli bilgiler girildiğinde sayfa kapandığında bilgiler gider ama lacal storage sayesinde bilgi girsek sayfası kapatıp tekrar açsak bile bilgiler hala kalıcı haldedir
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
  const temiz = metin.trim().replace(/\s+/g, " ");
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
  const mod = filtreSelect.value; // all | done | todo
  const q = trFold(aramaInput.value);
  return kaynak.filter(g => {
    if(mod === "done" && !g.tamamlandi) return false;
    if(mod === "todo" && g.tamamlandi) return false;
    if(q && !trFold(g.metin).includes(q)) return false;
    return true;
  });
}

// Çizim
function render(){
  const gosterilecek = filtreleVeAra(gorevler);
  liste.innerHTML = "";
  bosMesaj.style.display = gosterilecek.length ? "none" : "block";

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

    const silBtn = document.createElement("button");
    silBtn.className = "btn btn-outline-danger btn-sm ms-2";
    silBtn.innerHTML = '<i class="bi bi-trash"></i>';
    silBtn.addEventListener("click", () => gorevSil(g.id));

    li.append(cb, span, silBtn);
    liste.appendChild(li);
  }
}

// Tema
function temaYukle(){
  const kayitli = localStorage.getItem(THEME_KEY) || "light";
  document.body.classList.remove("light","dark");
  document.body.classList.add(kayitli);
  temaIcon.className = kayitli === "light" ? "bi bi-moon fs-5" : "bi bi-sun fs-5";
}
temaBtn.addEventListener("click", () => {
  const yeni = document.body.classList.contains("light") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, yeni);
  temaYukle();
});

// Olaylar
ekleBtn.addEventListener("click", () => { gorevEkle(input.value); input.value=""; input.focus(); });
input.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){ gorevEkle(input.value); input.value=""; }
});
aramaInput.addEventListener("input", render);
filtreSelect.addEventListener("change", render);

// Başlat
window.addEventListener("DOMContentLoaded", () => { yukle(); temaYukle(); render(); });