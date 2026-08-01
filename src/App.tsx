import React, { useState } from "react";
import { ReservationProvider } from "./context/ReservationContext";
import { ToastProvider } from "./context/ToastContext";
import { AppTab, NavBar } from "./components/NavBar/NavBar";
import { CalendarView } from "./components/CalendarView/CalendarView";
import { SearchReservations } from "./components/SearchReservations/SearchReservations";
import { AdminPanel } from "./components/AdminPanel/AdminPanel";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>("client");

  return (
    <ToastProvider>
      <ReservationProvider>
        <div className="min-vh-100 d-flex flex-column">
          <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />

          <main className="container-xxl flex-grow-1 py-4 px-3">
            {activeTab === "client" && <CalendarView />}

            {activeTab === "search" && <SearchReservations />}

            {activeTab === "admin" && <AdminPanel />}
          </main>
        </div>
      </ReservationProvider>
    </ToastProvider>
  );
};

export default App;
