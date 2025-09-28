# Powiatowy Inspektorat Weterynarii w Piszu - Strona WWW

Responsywna strona internetowa z panelem CMS, zgodna z wytycznymi WCAG 2.1, stworzona w Node.js.

## Funkcjonalności

### Dostępność (WCAG 2.1)
- ✅ Wszystkie elementy graficzne mają tekst alternatywny (alt)
- ✅ Wszystkie pozycje menu są dostępne przez klawisz Tab
- ✅ Program odczytuje treści stron (screen reader support)
- ✅ Odpowiedni kontrast tekstu i tła
- ✅ Odpowiedni odstęp pomiędzy liniami tekstu
- ✅ Poprawna struktura z pozycjonowanymi warstwami (nie tabele)
- ✅ Responsywność - płynne dostosowanie do rozdzielczości
- ✅ Dostosowanie w poziomie
- ✅ Możliwość zmiany kontrastu i powiększenia tekstu
- ✅ Brak elementów animowanych i zabronionych plików
- ✅ Odnośniki mają dobrze widoczny focus
- ✅ Automatycznie generowana mapa strony
- ✅ Treści dostępne przy dowolnym powiększeniu
- ✅ Unikalne wartości znacznika "title" dla każdej strony
- ✅ Język polski określony w atrybucie "lang"
- ✅ Dodatkowy dostęp do głównych pozycji przez tabulator (skiplinks)

### Panel CMS
- Zarządzanie stronami
- Zarządzanie aktualnościami
- System kategorii aktualności
- Edytor treści
- System użytkowników i uprawnień

### Funkcjonalności techniczne
- Responsywny design
- Optymalizacja SEO
- Automatyczne generowanie sitemap.xml
- System breadcrumbs
- Lazy loading obrazów
- Kompresja i optymalizacja

## Wymagania systemowe

- Node.js 16.x lub nowszy
- MongoDB 4.x lub nowszy
- npm lub yarn

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone <repository-url>
cd bip_www_cms
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:
```bash
cp .env.example .env
```

Edytuj plik `.env` i ustaw:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/weterynaria_pisz
SESSION_SECRET=your-secret-key-here
```

4. Uruchom MongoDB (jeśli nie jest uruchomiony):
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. Uruchom aplikację:
```bash
# Tryb deweloperski
npm run dev

# Tryb produkcyjny
npm start
```

6. Otwórz przeglądarkę i przejdź do:
- Strona główna: http://localhost:3000
- Panel administracyjny: http://localhost:3000/admin

## Pierwsze uruchomienie

1. Utwórz pierwszego użytkownika administracyjnego:
```bash
node scripts/create-admin.js
```

2. Zaloguj się do panelu administracyjnego używając utworzonych danych

3. Utwórz stronę główną w panelu administracyjnym

## Struktura projektu

```
├── models/              # Modele bazy danych
│   ├── Page.js         # Model strony
│   ├── News.js         # Model aktualności
│   └── User.js         # Model użytkownika
├── routes/              # Routing
│   ├── main.js         # Główne trasy
│   ├── admin.js        # Trasy panelu administracyjnego
│   └── api.js          # API endpoints
├── views/               # Szablony EJS
│   ├── layout.ejs      # Główny layout
│   ├── index.ejs       # Strona główna
│   ├── page.ejs        # Szablon strony
│   ├── news-list.ejs   # Lista aktualności
│   ├── news-detail.ejs # Szczegóły aktualności
│   ├── sitemap.ejs     # Mapa strony
│   ├── error.ejs       # Strona błędu
│   └── admin/          # Szablony panelu administracyjnego
├── public/              # Zasoby statyczne
│   ├── css/            # Style CSS
│   ├── js/             # Skrypty JavaScript
│   └── images/         # Obrazy
├── server.js           # Główny plik serwera
└── package.json        # Konfiguracja npm
```

## Dostępność

### Kontrolki dostępności
- **Kontrast**: Przełączanie trybu wysokiego kontrastu
- **Rozmiar czcionki**: A-, A, A+ (zmniejsz, domyślny, zwiększ)
- **Nawigacja klawiaturą**: Wszystkie elementy dostępne przez Tab

### Skróty klawiszowe
- `Alt + 1`: Przejdź do treści głównej
- `Alt + 2`: Przejdź do menu głównego
- `Alt + 3`: Przejdź do informacji kontaktowych
- `Alt + C`: Przełącz kontrast
- `Alt + Plus`: Zwiększ rozmiar czcionki
- `Alt + Minus`: Zmniejsz rozmiar czcionki
- `Alt + 0`: Resetuj rozmiar czcionki

### Funkcje dla czytników ekranu
- Skip links (przeskakiwanie do głównych sekcji)
- Semantyczne znaczniki HTML5
- ARIA labels i role
- Ogłoszenia o zmianach treści
- Opisowe teksty alternatywne

## API

### Endpoints dla stron
- `GET /api/pages` - Lista wszystkich stron
- `POST /api/pages` - Utwórz nową stronę
- `PUT /api/pages/:id` - Aktualizuj stronę
- `DELETE /api/pages/:id` - Usuń stronę

### Endpoints dla aktualności
- `GET /api/news` - Lista wszystkich aktualności
- `POST /api/news` - Utwórz nową aktualność
- `PUT /api/news/:id` - Aktualizuj aktualność
- `DELETE /api/news/:id` - Usuń aktualność

## Wdrażanie

### Zmienne środowiskowe produkcyjne
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@host:port/database
SESSION_SECRET=strong-secret-key
```

### Optymalizacje produkcyjne
- Kompresja gzip
- Cache headers
- Helmet.js dla bezpieczeństwa
- Optymalizacja obrazów
- Minifikacja CSS/JS

## Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

## Wsparcie

W przypadku problemów lub pytań, skontaktuj się z zespołem deweloperskim.

---

**Powiatowy Inspektorat Weterynarii w Piszu**  
al. Józefa Piłsudskiego 15A/1, 12-200 Pisz  
Tel: 87 423 27 53
