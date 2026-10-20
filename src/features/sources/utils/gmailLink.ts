/** Gmail's compose window in the browser with a ready message. */
export const gmailLink = (to: string, subject: string, body: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}` +
  `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
