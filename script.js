// ===== VARIÁVEIS GLOBAIS =====
let dadosOriginais = [];
let dadosFiltrados = [];
let dadosProcessados = {};
let charts = {};
const USUARIOS_VALIDOS = {admin:'admin',user:'1234'};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded',()=>{
    loadSavedData();
    checkLogin();
    document.querySelector('.upload-area').addEventListener('dragover',handleDragOver);
    document.querySelector('.upload-area').addEventListener('dragleave',handleDragLeave);
    document.querySelector('.upload-area').addEventListener('drop',handleDrop);
});

function checkLogin(){
    if(localStorage.getItem('usuario')){
        document.getElementById('loginScreen').style.display='none';
        document.getElementById('mainApp').style.display='flex';
        showSection('dashboard');
        renderDashboard();
    }
}

// ===== LOGIN =====
function login(){
    const user=document.getElementById('username').value.trim();
    const pass=document.getElementById('password').value;
    if(USUARIOS_VALIDOS[user]===pass){
        localStorage.setItem('usuario',user);
        document.getElementById('loginScreen').style.display='none';
        document.getElementById('mainApp').style.display='flex';
        showSection('dashboard');
    }else alert('❌ Credenciais inválidas!');
}

function demoLogin(){
    document.getElementById('username').value='admin';
    document.getElementById('password').value='admin';
    login();
}

function logout(){
    localStorage.clear();
    location.reload();
}

// ===== NAVEGAÇÃO =====
function showSection(section){
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById(section+'Section').classList.add('active');
    if(section==='dashboard') renderDashboard();
}

function toggleSidebar(){
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== UPLOAD PLANILHA =====
function handleFileUpload(e){
    readExcel(e.target.files[0]);
}

function handleDragOver(e){
    e.preventDefault();
    e.currentTarget.style.borderColor='#667eea';
}

function handleDragLeave(e){
    e.currentTarget.style.borderColor='#e2e8f0';
}

function handleDrop(e){
    e.preventDefault();
    readExcel(e.dataTransfer.files[0]);
}

function readExcel(file){
    const reader=new FileReader();
    reader.onload=function(e){
        const data= new Uint8Array(e.target.result);
        const workbook=XLSX.read(data,{type:'array'});
        const firstSheet=workbook.SheetNames[0];
        const worksheet=workbook.Sheets[firstSheet];
        dadosOriginais=XLSX.utils.sheet_to_json(worksheet,{header:1});
        showPreview();
    };
    reader.readAsArrayBuffer(file);
}

function showPreview(){
    const table=document.getElementById('previewTable');
    table.innerHTML='';
    const thead=document.createElement('table');
    thead.innerHTML='<thead><tr>'+dadosOriginais[0].map(h=>`<th>${h||''}</th>`).join('')+'</tr></thead>';
    const tbody=document.createElement('tbody');
    dadosOriginais.slice(1,11).forEach(row=>{
        tbody.innerHTML+=`<tr>${row.map(cell=>`<td>${cell||''}</td>`).join('')}</tr>`;
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    table.style.display='block';
    document.getElementById('processBtn').style.display='block';
}

// ===== PROCESSAMENTO DE DADOS =====
function processData(){
    if(dadosOriginais.length<2) return alert('❌ Carregue uma planilha válida!');
    
    const headers=dadosOriginais[0];
    const rows=dadosOriginais.slice(1);
    
    dadosProcessados={};
    dadosFiltrados=rows.map(row=>{
        const obj={};
        headers.forEach((header,i)=>obj[header.toString().trim().toLowerCase()]=row[i]);
        return obj;
    }).filter(row=>row);

    processMetrics();
    updateFilters();
    saveData();
    showSection('dashboard');
}

function processMetrics(){
    const clienteHoras={};
    const tecnicoHoras={};
    const tipos={};
    const grupos={};

    dadosFiltrados.forEach(row=>{
        const cliente=row.cliente||row['cliente']||row['nome cliente']||'';
        const grupo=row['grupo de cliente']||row.grupo||'';
        const tecnico=row.técnico||row['tecnico']||'';
        const tipo=row['tipo de manutenção']||row['tipo']||'';
        const horas=parseFloat(row['duração']||row['horas']||row['horas trabalhadas']||0)||0;
        
        // Horas por cliente
        clienteHoras[cliente]=(clienteHoras[cliente]||0)+horas;
        // Horas por técnico
        tecnicoHoras[tecnico]=(tecnicoHoras[tecnico]||0)+horas;
        // Tipos
        tipos[tipo]=(tipos[tipo]||0)+1;
        // Grupos
        grupos[grupo]=(grupos[grupo]||0)+horas;
    });

    dadosProcessados={
        clienteHoras,
        tecnicoHoras,
        tipos