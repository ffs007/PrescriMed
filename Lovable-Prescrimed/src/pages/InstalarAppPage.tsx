import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, MoreVertical, Plus, Share, Smartphone, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </span>
      <span className="text-sm leading-relaxed text-foreground">{children}</span>
    </li>
  );
}

export default function InstalarAppPage() {
  const defaultTab = useMemo(() => (isIos() ? "ios" : "android"), []);
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar">
          <Link to="/app">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Instalar o PrescriMed</h1>
          <p className="text-sm text-muted-foreground">
            Tenha o app na tela inicial do seu celular, com abertura rápida e uso offline do que já foi aberto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            Como instalar no seu dispositivo
          </CardTitle>
          <CardDescription>
            Escolha a plataforma do seu celular e siga os passos. A instalação leva menos de 1 minuto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="android">Android</TabsTrigger>
              <TabsTrigger value="ios">iPhone / iPad</TabsTrigger>
            </TabsList>

            <TabsContent value="android" className="mt-4 space-y-4">
              <ol className="space-y-3">
                <Step number={1}>
                  Abra o PrescriMed no navegador <strong>Chrome</strong> do seu Android.
                </Step>
                <Step number={2}>
                  Se aparecer uma faixa no topo com o botão <strong>"Instalar app"</strong>, toque nela e confirme. Pronto!
                </Step>
                <Step number={3}>
                  Se a faixa não aparecer, toque no menu <MoreVertical className="inline h-4 w-4 align-text-bottom" aria-label="menu de três pontos" /> (três pontos) no canto superior direito do Chrome.
                </Step>
                <Step number={4}>
                  Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </Step>
                <Step number={5}>
                  Confirme em <strong>"Instalar"</strong>. O ícone do PrescriMed aparecerá na sua tela inicial.
                </Step>
              </ol>
            </TabsContent>

            <TabsContent value="ios" className="mt-4 space-y-4">
              <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                No iPhone e iPad, a instalação só funciona pelo navegador <strong>Safari</strong>. Se você abriu
                pelo Chrome ou outro navegador, copie o endereço e abra no Safari.
              </div>
              <ol className="space-y-3">
                <Step number={1}>
                  Abra o PrescriMed no <strong>Safari</strong>.
                </Step>
                <Step number={2}>
                  Toque no botão <strong>Compartilhar</strong>{" "}
                  <Share className="inline h-4 w-4 align-text-bottom" aria-label="ícone de compartilhar" /> (o
                  quadrado com a seta para cima, na barra inferior do Safari).
                </Step>
                <Step number={3}>
                  Role a lista e toque em{" "}
                  <strong>
                    "Adicionar à Tela de Início"{" "}
                    <SquarePlus className="inline h-4 w-4 align-text-bottom" aria-label="ícone de adicionar" />
                  </strong>
                  .
                </Step>
                <Step number={4}>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito.
                </Step>
                <Step number={5}>
                  O ícone do PrescriMed aparecerá na sua tela inicial, como um app comum.
                </Step>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-primary" />
            Depois de instalado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
            <li>O app abre em tela cheia, sem barra de navegador, como um aplicativo nativo.</li>
            <li>Listas de condições, protocolos e rascunhos já abertos continuam disponíveis mesmo sem internet.</li>
            <li>Quando estiver offline, um aviso aparece no topo; os dados sincronizam ao reconectar.</li>
            <li>
              <Plus className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> Para remover, basta apagar o
              ícone como qualquer outro app.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
