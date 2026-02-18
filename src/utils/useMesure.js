import { onCleanup, onMount, createSignal } from "solid-js";

export function getTimeBetween(startTime, endTime = Date.now(), lang = 'en') {
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30

  const diff = startTime - endTime
  const absDiff = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(lang, { style: "short", numeric: 'auto' })

  if (absDiff < minute) return 'now';
  if (absDiff < hour) return rtf.format(Math.floor(diff / minute), 'minute')
  if (absDiff < day) return rtf.format(Math.floor(diff / hour), 'hour')
  if (absDiff < week) return rtf.format(Math.floor(diff / day), 'day')
  if (absDiff < month) return rtf.format(Math.floor(diff / week), 'week')

  return rtf.format(Math.floor(diff / month), 'month')
}

export function useNow(interval = 60000) {
  const [now, setNow] = createSignal(Date.now());

  let timer
  onMount(() => timer = setInterval(() => setNow(Date.now()), interval))
  onCleanup(() => clearInterval(timer))

  return now
}

export function getSizePlaceholder(bytes, local = 'en-CA') {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
  if (bytes === 0) return '0 o';

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)

  return new Intl.NumberFormat(local, {
    style: 'unit',
    unit: units[i],
    unitDisplay: 'short',
    maximumFractionDigits: 1
  }).format(value)
}
