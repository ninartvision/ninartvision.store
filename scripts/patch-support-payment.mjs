import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'support.html');
let h = fs.readFileSync(file, 'utf8');

const start = h.indexOf('<div class="payment-fields"');
const end = h.indexOf('<p class="payment-note"', start);
if (start === -1 || end === -1) {
  console.error('payment-fields block not found');
  process.exit(1);
}

const block = `<div class="payment-fields" style="text-align:center;">
      <p class="muted" style="margin-bottom:1.25rem;line-height:1.6;"
         data-en="Message us on WhatsApp with the amount you wish to support and we will reply with payment instructions."
         data-ka="მოგვწერეთ WhatsApp-ზე მხარდაჭერის თანხით და გიგზავნით გადახდის ინსტრუქციას.">
        Message us on WhatsApp with the amount you wish to support and we will reply with payment instructions.
      </p>
      <a class="btn btn-dark"
         href="https://wa.me/995579388833?text=Hello%2C%20I%20would%20like%20to%20support%20Ninart%20Vision.%20Please%20send%20bank%20transfer%20details."
         target="_blank"
         rel="noopener noreferrer"
         data-en="Request payment details on WhatsApp"
         data-ka="გადახდის დეტალები WhatsApp-ზე">
        Request payment details on WhatsApp
      </a>
    </div>
`;

h = h.slice(0, start) + block + h.slice(end);
fs.writeFileSync(file, h);
console.log('Patched support payment modal');
