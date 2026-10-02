import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  // primary: l'azione principale della pagina. secondary: le altre. danger: azioni da fare con
  // attenzione (disattivare, eliminare). ghost: pulsante su sfondo scuro (barra laterale).
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  small?: boolean;
};

export function Button({ variant = 'secondary', small, className = '', type, ...props }: Props) {
  const classes = ['btn', `btn-${variant}`, small ? 'btn-small' : '', className].join(' ').trim();
  // Un pulsante dentro un form invia il form solo se lo dichiara: evita invii per sbaglio.
  return <button type={type ?? 'button'} className={classes} {...props} />;
}
