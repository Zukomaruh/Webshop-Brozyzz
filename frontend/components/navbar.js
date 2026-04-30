//erstellt <nav> Element
const nav = document.createElement("nav");
nav.setAttribute("class", "navbar navbar-expand-lg navbar-dark bg-dark");

//fragt Seite ab um navigationspfade zu adaptieren (abhängig davon ob die aktuelle seite im Ordner pages ist)
const inPages = window.location.pathname.includes('/pages/');
const base = inPages ? '../' : '';

//navbar als html code in <nav> Element einbinden
nav.innerHTML = `
<div class="container-fluid">
        <a class="navbar-brand fs-4 fw-bold" href="${base}index.html">Brozyzz</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Navigation umschalten">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a href="${base}pages/login.html" class="nav-link">Login</a>
                </li>
                <li class="nav-item">
                    <a href="${base}pages/registration.html" class="nav-link">Register</a>
                </li>
                <li class="nav-item">
                    <a href="${base}pages/logout.html" class="nav-link">Logout</a>
                </li>
                <li class="nav-item">
                    <a href="${base}pages/admin.html" class="nav-link">Admin</a>
                </li>
            </ul>
            <div class="d-flex gap-2">
                <a href="${base}pages/basket.html" class="btn btn-warning">Basket <span id="cartBadge" class="badge bg-secondary">0</span></a>
                <a href="${base}pages/profile.html" class="btn btn-warning">Profile</a>
            </div>
        </div>
    </div>
`;

//<nav> wird in body zuoberst eingebunden
document.body.prepend(nav);