"use client";

import {
  KeyRound,
  Mail,
  Shield,
  Smartphone,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProfileSidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  label: string;
}

const sidebarItems: ProfileSidebarItem[] = [
  { id: "personal-info", label: "Informações Pessoais", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "password", label: "Senha", icon: KeyRound },
  { id: "passkey", label: "Passkey", icon: UserCheck },
  { id: "two-factor", label: "Autenticação de Dois Fatores", icon: Shield },
  { id: "backup-codes", label: "Códigos de Backup", icon: Smartphone },
  { id: "linked-accounts", label: "Contas Vinculadas", icon: Users },
  { id: "active-sessions", label: "Sessões Ativas", icon: Smartphone },
  { id: "delete-account", label: "Excluir Conta", icon: Trash2 },
];

export function ProfileSidebar() {
  const [activeSection, setActiveSection] = useState<string>("personal-info");

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarItems.map((item) => item.id);
      const scrollPosition = window.scrollY + 100; // Offset para melhor detecção

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Verificar na montagem inicial

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Offset para compensar header fixo
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-2">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <Button
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  variant="ghost"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </div>
  );
}
