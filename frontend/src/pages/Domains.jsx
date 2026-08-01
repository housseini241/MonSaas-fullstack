import { useEffect, useState } from "react";
import api from "@/lib/api";
import DomainManager from "@/components/DomainManager";
import AppShell from "@/components/AppShell";

export default function Domains() {
  const [project, setProject] = useState(null);

  useEffect(() => {
    api.get("/sites").then((r) => {
      const first = (r.data || [])[0];
      if (first) {
        setProject({ kind: "site", id: first.id, business_type: first.business_type, city: first.city });
      } else {
        api.get("/shops").then((rs) => {
          const firstShop = (rs.data || [])[0];
          if (firstShop) setProject({ kind: "shop", id: firstShop.id, business_type: "boutique", city: firstShop.city });
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <AppShell
      title={<>Achetez & connectez votre domaine <span className="bg-gradient-to-r from-[#4F46E5] to-[#22D3EE] bg-clip-text text-transparent">en 30 sec</span>.</>}
    >
      <div className="space-y-6" data-testid="domains-page">
        <div className="bg-white border border-[#E4E8F1] rounded-xl p-6 shadow-sm">
          <p className="text-[#4A4F6B] text-[15px] leading-relaxed">
            Recherche, paiement, DNS et SSL — tout est automatique.
            <span className="text-[#6B7280]"> Aucune configuration technique à faire de votre côté.</span>
          </p>
          {project && (
            <div className="mt-4 inline-flex items-center gap-2 bg-[#EEF0FE] text-[#4F46E5] px-3 py-1.5 rounded-2xl t-label !text-[#4F46E5] !text-[10px]">
              <span>cible :</span>
              <span className="font-semibold">{project.kind}</span>
              <span>·</span>
              <span className="text-[#4A4F6B] normal-case font-normal">
                {project.business_type} {project.city && `/ ${project.city}`}
              </span>
            </div>
          )}
        </div>

        <DomainManager
          businessType={project?.business_type}
          city={project?.city}
          projectId={project?.id}
          projectKind={project?.kind || "site"}
        />
      </div>
    </AppShell>
  );
}