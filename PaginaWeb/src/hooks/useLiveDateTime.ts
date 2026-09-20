import { useState, useEffect } from 'react';

export function useLiveDateTime() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Time format: HH:mm:ss (24-hour with seconds)
  const time24 = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Time format: hh:mm:ss a (12-hour with AM/PM)
  const time12 = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Short time: HH:mm
  const timeShort = currentDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Date format: "27 ago 2026"
  const dateShort = currentDate.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Date format: "27 AGO 2026" (uppercase)
  const dateShortUpper = dateShort.toUpperCase();

  // Date format: "jue, 27 ago"
  const dayAndDate = currentDate.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  // Date format: "Jueves, 27 de Agosto de 2026"
  const dateLong = currentDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Date format: DD/MM/YYYY
  const dateNumeric = currentDate.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return {
    now: currentDate,
    time24,
    time12,
    timeShort,
    dateShort,
    dateShortUpper,
    dayAndDate,
    dateLong,
    dateNumeric
  };
}
