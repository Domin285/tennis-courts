Responsywna aplikacja webowa służąca do przeglądania dostępnych terminów oraz zarządzania rezerwacjami kortów tenisowych.

Projekt został wykonany w **React**, **TypeScript**, **Bootstrap** oraz **SCSS Modules**. Rezerwacje są zapisywane lokalnie w przeglądarce przy użyciu `localStorage`.

## Funkcjonalności

### Dla użytkownika

- przeglądanie kalendarza rezerwacji,
- wybór konkretnego kortu,
- zmiana widoku kalendarza:
  - dzień,
  - tydzień,
  - miesiąc,
- przechodzenie między kolejnymi okresami,
- szybki powrót do aktualnej daty,
- wybór dostępnego terminu,
- tworzenie nowej rezerwacji,
- sprawdzanie dostępności terminu,
- wykrywanie konfliktów z istniejącymi rezerwacjami,
- wyszukiwanie rezerwacji po nazwisku,
- anulowanie rezerwacji,
- wyświetlanie komunikatów o powodzeniu lub błędzie.

### Dla administratora

- przeglądanie wszystkich rezerwacji,
- wyszukiwanie po:
  - imieniu,
  - nazwisku,
  - adresie e-mail,
  - notatkach,
- filtrowanie według rodzaju kortu,
- sortowanie według:
  - daty rezerwacji,
  - daty utworzenia,
- edycja danych klienta,
- zmiana kortu,
- zmiana terminu,
- anulowanie rezerwacji,
- automatyczne usuwanie rezerwacji, których termin już minął.

---

## Rodzaje kortów

Aplikacja obsługuje trzy niezależne korty:

Kort trawiasty - Kort oznaczony kolorem zielonym
Kort ceglany - Kort oznaczony osobnym kolorem
Kort twardy - Kort oznaczony kolorem żółtym

Każdy kort posiada własny kalendarz.

Rezerwacja jednego kortu nie blokuje pozostałych kortów w tym samym terminie.

---

## Technologie

### Frontend

- React
- TypeScript
- Bootstrap 5
- SCSS
- CSS Modules
- React Context API

### Pozostałe narzędzia

- Create React App
- npm
- localStorage
- Git
- GitHub

---

## Uruchomienie projektu

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/TWOJ_LOGIN/tennis-courts.git
```

### 2. Przejdź do folderu projektu

```bash
cd tennis-courts
```

### 3. Zainstaluj zależności

```bash
npm install
```

### 4. Uruchom aplikację

```bash
npm start
```

Aplikacja powinna uruchomić się pod adresem:

```text
http://localhost:3000
```

---

## Struktura projektu

```text
src/
├── components/
│   ├── AdminEditModal/
│   │   ├── AdminEditModal.tsx
│   │   └── AdminEditModal.module.scss
│   │
│   ├── AdminPanel/
│   │   ├── AdminPanel.tsx
│   │   └── AdminPanel.module.scss
│   │
│   ├── CalendarView/
│   │   ├── CalendarView.tsx
│   │   └── CalendarView.module.scss
│   │
│   ├── ConfirmModal/
│   │   ├── ConfirmModal.tsx
│   │   └── ConfirmModal.module.scss
│   │
│   ├── CourtCalendar/
│   │   ├── CourtCalendar.tsx
│   │   └── CourtCalendar.module.scss
│   │
│   ├── NavBar/
│   │   ├── NavBar.tsx
│   │   └── NavBar.module.scss
│   │
│   ├── ReservationModal/
│   │   ├── ReservationModal.tsx
│   │   └── ReservationModal.module.scss
│   │
│   ├── SearchReservations/
│   │   ├── SearchReservations.tsx
│   │   └── SearchReservations.module.scss
│   │
│   └── Toast/
│       ├── ToastContainer.tsx
│       └── ToastContainer.module.scss
│
├── context/
│   ├── ReservationContext.tsx
│   └── ToastContext.tsx
│
├── hooks/
│
├── styles/
│   └── main.scss
│
├── types/
│
├── utils/
│
├── App.tsx
├── index.tsx
├── styles.d.ts
└── styles.scss
```

Każdy większy komponent posiada osobny folder oraz własny plik `SCSS Module`.

---

## Działanie systemu rezerwacji

Przed zapisaniem nowej rezerwacji aplikacja sprawdza:

- poprawność imienia i nazwiska,
- poprawność adresu e-mail,
- poprawność daty rozpoczęcia i zakończenia,
- dostępność wybranego terminu,
- konflikt z inną rezerwacją tego samego kortu.

Przykład:

- kort trawiasty jest zajęty od `10:00` do `12:00`,
- w tym czasie nie można utworzyć kolejnej rezerwacji kortu trawiastego,
- nadal można zarezerwować kort ceglany lub twardy.

Rezerwacje są identyfikowane za pomocą unikalnego identyfikatora.

---

## Automatyczne usuwanie zakończonych rezerwacji

Rezerwacja zostaje automatycznie usunięta, gdy minie jej czas zakończenia.

Czyszczenie jest wykonywane:

- podczas uruchomienia aplikacji,
- cyklicznie podczas działania aplikacji,
- po powrocie do karty przeglądarki,
- przed utworzeniem lub edycją kolejnej rezerwacji.

Dzięki temu zakończone terminy nie blokują kalendarza.

---

## Panel administratora

Panel administratora umożliwia zarządzanie wszystkimi rezerwacjami.

Administrator może:

- przeglądać listę rezerwacji,
- filtrować rezerwacje według kortu,
- wyszukiwać klientów,
- sortować dane,
- edytować rezerwacje,
- zmieniać termin,
- zmieniać wybrany kort,
- anulować rezerwacje.

> Obecna wersja projektu nie posiada logowania ani autoryzacji. Panel administratora jest dostępny jako część aplikacji demonstracyjnej.

---

## Przechowywanie danych

Projekt nie korzysta z zewnętrznego backendu ani bazy danych.

Rezerwacje są zapisywane w:

```text
localStorage
```

Dzięki temu dane:

- pozostają po odświeżeniu strony,
- są dostępne po ponownym uruchomieniu aplikacji,
- nie wymagają połączenia z serwerem.

Należy jednak pamiętać, że rezerwacje:

- są dostępne tylko w tej samej przeglądarce,
- są zapisane tylko na konkretnym urządzeniu,
- mogą zostać usunięte po wyczyszczeniu danych przeglądarki.

---

## Responsywność i dostępność

Aplikacja została dostosowana do działania na:

- komputerach,
- laptopach,
- tabletach,
- telefonach.

Zastosowane rozwiązania:

- responsywny układ Bootstrap Grid,
- mobilne menu z płynną animacją,
- responsywne formularze i tabele,
- własne okna modalne,
- obsługa klawisza `Escape`,
- kontrolowanie fokusu w modalach,
- możliwość obsługi klawiaturą,
- atrybuty `aria`,
- komunikaty `role="status"` oraz `role="alert"`,
- ograniczenie animacji dla użytkowników korzystających z `prefers-reduced-motion`.

---

## Powiadomienia

Aplikacja posiada własny system powiadomień typu toast.

Komunikaty informują między innymi o:

- poprawnym utworzeniu rezerwacji,
- zapisaniu zmian,
- anulowaniu rezerwacji,
- konflikcie terminów,
- niepoprawnych danych,
- braku możliwości wykonania wybranej operacji.

Powiadomienia zamykają się automatycznie, ale można je również usunąć ręcznie.

---

## Możliwe kierunki rozwoju

W przyszłości aplikacja może zostać rozszerzona o:

- backend REST API,
- bazę danych PostgreSQL lub MySQL,
- rejestrację i logowanie użytkowników,
- autoryzację administratora,
- historię zakończonych rezerwacji,
- płatności internetowe,
- potwierdzenia rezerwacji e-mailem,
- resetowanie hasła,
- blokowanie terminów przez administratora,
- zarządzanie godzinami otwarcia,
- ceny zależne od kortu i godziny,
- generowanie raportów,
- testy jednostkowe,
- testy integracyjne,
- testy end-to-end,
- publikację aplikacji online.

---

## Dostępne skrypty

### Uruchomienie projektu

```bash
npm start
```

### Utworzenie wersji produkcyjnej

```bash
npm run build
```

### Uruchomienie testów

```bash
npm test
```

---

## Autor

**Dominik Dziombowski**

Projekt wykonany jako aplikacja demonstracyjna prezentująca umiejętności z zakresu:

- React,
- TypeScript,
- projektowania responsywnych interfejsów,
- zarządzania stanem,
- walidacji formularzy,
- pracy z kalendarzem,
- organizacji kodu,
- obsługi `localStorage`,
- tworzenia dostępnych komponentów UI.

---

## Licencja

Projekt został przygotowany w celach edukacyjnych i demonstracyjnych.
