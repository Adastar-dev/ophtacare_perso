"use client"

/**
 * Ordonnance imprimable. Une seule source HTML (styles en ligne) sert à
 * l'aperçu et à l'impression. L'impression passe par un conteneur dédié du
 * document (pas de fenêtre popup), ce qui fonctionne aussi dans l'app installée
 * sur iPhone : « Imprimer » puis « Enregistrer en PDF » ou AirPrint.
 */

import type { Prescription, User } from "@/lib/types"
import { ageLabel, fmtDate, nomComplet, typeTeinteLabels, typeVerreLabels } from "@/lib/format"

function esc(v?: string | number | null): string {
  if (v === null || v === undefined) return ""
  return String(v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string)
}

const dash = (v?: string | null) => (v ? esc(v) : "—")

export function aCorrectionOptique(p: Prescription): boolean {
  return !!(p.type_verre || p.type_teinte || p.oeil_droit_add || p.oeil_gauche_add || p.ecart_pupillaire)
}

export function buildPrescriptionHtml(p: Prescription, praticien: User | null): string {
  const c = p.consultation
  const patient = c?.patient
  const lieu = c?.lieu
  const date = fmtDate(c?.date_consultation ?? p.created_at, { day: "numeric", month: "long", year: "numeric" })

  const td = "border:1px solid #cbd5e1;padding:7px 10px;text-align:center;"
  const th = "border:1px solid #cbd5e1;padding:7px 10px;background:#f1f5f9;font-weight:600;"
  const lbl = "color:#64748b;"
  const h3 = "font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#334155;margin:22px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;"

  const nomPraticien = praticien ? `${praticien.titre ? praticien.titre + " " : ""}${praticien.name}` : ""

  const optique = aCorrectionOptique(p)
    ? `
    <h3 style="${h3}">Correction optique</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr>
        <th style="${th}text-align:left;">Œil</th><th style="${th}">Sphère</th><th style="${th}">Cylindre</th><th style="${th}">Axe</th><th style="${th}">Addition</th>
      </tr></thead>
      <tbody>
        <tr><td style="${td}text-align:left;font-weight:600;">OD (droit)</td><td style="${td}">${dash(c?.ref_od_sphere)}</td><td style="${td}">${dash(c?.ref_od_cylindre)}</td><td style="${td}">${c?.ref_od_axe ? esc(c.ref_od_axe) + "°" : "—"}</td><td style="${td}">${dash(p.oeil_droit_add)}</td></tr>
        <tr><td style="${td}text-align:left;font-weight:600;">OG (gauche)</td><td style="${td}">${dash(c?.ref_og_sphere)}</td><td style="${td}">${dash(c?.ref_og_cylindre)}</td><td style="${td}">${c?.ref_og_axe ? esc(c.ref_og_axe) + "°" : "—"}</td><td style="${td}">${dash(p.oeil_gauche_add)}</td></tr>
      </tbody>
    </table>
    <div style="display:flex;gap:32px;flex-wrap:wrap;font-size:14px;margin-top:10px;">
      ${p.type_verre ? `<p style="margin:0;"><span style="${lbl}">Verres :</span> <b>${esc(typeVerreLabels[p.type_verre] ?? p.type_verre)}</b></p>` : ""}
      ${p.type_teinte ? `<p style="margin:0;"><span style="${lbl}">Teinte :</span> <b>${esc(typeTeinteLabels[p.type_teinte] ?? p.type_teinte)}</b></p>` : ""}
      ${p.ecart_pupillaire ? `<p style="margin:0;"><span style="${lbl}">Écart pupillaire :</span> <b>${esc(p.ecart_pupillaire)} mm</b></p>` : ""}
    </div>`
    : ""

  const lignes = (p.traitement ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
  const traitement = lignes.length
    ? `
    <h3 style="${h3}">Traitement</h3>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;">
      ${lignes.map((l) => `<li>${esc(l)}</li>`).join("")}
    </ol>`
    : ""

  return `
  <div style="font-family:Georgia,'Times New Roman',serif;color:#0f172a;">
    <div style="display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #1e293b;padding-bottom:14px;">
      <div>
        <p style="margin:0;font-size:20px;font-weight:bold;">${esc(nomPraticien)}</p>
        ${praticien?.specialite ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${esc(praticien.specialite)}</p>` : ""}
        ${praticien?.numero_ordre ? `<p style="margin:2px 0 0;font-size:12px;color:#475569;">N° d'ordre : ${esc(praticien.numero_ordre)}</p>` : ""}
        ${praticien?.telephone ? `<p style="margin:2px 0 0;font-size:12px;color:#475569;">Tél. : ${esc(praticien.telephone)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:15px;font-weight:bold;">${esc(lieu?.nom ?? "")}</p>
        ${lieu?.adresse ? `<p style="margin:2px 0 0;font-size:12px;color:#475569;">${esc(lieu.adresse)}</p>` : ""}
        ${lieu?.telephone ? `<p style="margin:2px 0 0;font-size:12px;color:#475569;">Tél. : ${esc(lieu.telephone)}</p>` : ""}
      </div>
    </div>

    <p style="text-align:right;font-size:14px;margin:18px 0 0;">Le ${esc(date)}</p>
    <h1 style="text-align:center;font-size:20px;letter-spacing:5px;text-transform:uppercase;margin:16px 0 20px;">Ordonnance</h1>

    <div style="font-size:14px;margin-bottom:6px;">
      <p style="margin:2px 0;"><span style="${lbl}">Patient :</span> <b>${esc(nomComplet(patient))}</b></p>
      <p style="margin:2px 0;"><span style="${lbl}">Âge :</span> ${esc(ageLabel(patient?.date_naissance))}${patient?.code_patient ? ` <span style="${lbl}">· Dossier ${esc(patient.code_patient)}</span>` : ""}</p>
    </div>

    ${optique}
    ${traitement}
    ${p.remarques ? `<h3 style="${h3}">Remarques</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${esc(p.remarques)}</p>` : ""}

    <div style="display:flex;justify-content:flex-end;margin-top:56px;">
      <div style="text-align:center;">
        <div style="height:70px;width:220px;border-bottom:1px solid #94a3b8;"></div>
        <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Signature et cachet</p>
      </div>
    </div>
  </div>`
}

/** Aperçu à l'écran (même rendu que l'impression). */
export function PrescriptionPreview({ prescription, praticien }: { prescription: Prescription; praticien: User | null }) {
  return (
    <div className="bg-white text-slate-900 rounded-lg border overflow-x-auto">
      <div
        className="mx-auto w-full max-w-[210mm] min-w-[480px] p-6 sm:p-10"
        dangerouslySetInnerHTML={{ __html: buildPrescriptionHtml(prescription, praticien) }}
      />
    </div>
  )
}

/** Imprime un fragment HTML seul (le reste de la page est masqué à l'impression). */
export function printHtml(html: string, titre?: string) {
  let root = document.getElementById("print-root")
  if (!root) {
    root = document.createElement("div")
    root.id = "print-root"
    document.body.appendChild(root)
  }
  root.innerHTML = `<div class="print-page">${html}</div>`
  const previousTitle = document.title
  if (titre) document.title = titre // nom proposé pour le PDF
  const cleanup = () => {
    document.title = previousTitle
    window.removeEventListener("afterprint", cleanup)
  }
  window.addEventListener("afterprint", cleanup)
  // Laisse le navigateur appliquer le contenu avant d'ouvrir l'impression
  setTimeout(() => window.print(), 50)
}

export function printPrescription(p: Prescription, praticien: User | null) {
  const patient = p.consultation?.patient
  printHtml(buildPrescriptionHtml(p, praticien), `Ordonnance ${nomComplet(patient)} ${fmtDate(p.consultation?.date_consultation, { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-")}`)
}
