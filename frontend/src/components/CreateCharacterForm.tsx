import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCombatStore } from "../store/combatStore";
import { v4 as uuidv4 } from "uuid";

interface CreateCharacterFormProps {
  campaignId: string;
}

export function CreateCharacterForm({ campaignId }: CreateCharacterFormProps) {
  const { createCharacter, connectToCampaign, setMyCharacterId } = useCombatStore();

  useEffect(() => {
    connectToCampaign(campaignId);
  }, [campaignId, connectToCampaign]);

  const [name, setName] = useState("");
  const [localCampaignId, setLocalCampaignId] = useState(campaignId || "camp-1");
  const [maxHp, setMaxHp] = useState("");
  const [gold, setGold] = useState("");
  const [ki, setKi] = useState("");
  const [zeon, setZeon] = useState("");

  const [resistances, setResistances] = useState({
    FIL: "",
    CON: "",
    PEN: "",
    CAL: "",
    ELE: "",
    FRI: "",
    ENE: ""
  });

  const handleResChange = (type: keyof typeof resistances, val: string) => {
    setResistances(prev => ({ ...prev, [type]: val }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      name: name || "Nuevo Combatiente",
      maxHp: parseInt(maxHp, 10) || 1,
      gold: parseInt(gold, 10) || 0,
      ki: parseInt(ki, 10) || 0,
      zeon: parseInt(zeon, 10) || 0,
      resistances: {
        FIL: parseInt(resistances.FIL, 10) || 0,
        CON: parseInt(resistances.CON, 10) || 0,
        PEN: parseInt(resistances.PEN, 10) || 0,
        CAL: parseInt(resistances.CAL, 10) || 0,
        ELE: parseInt(resistances.ELE, 10) || 0,
        FRI: parseInt(resistances.FRI, 10) || 0,
        ENE: parseInt(resistances.ENE, 10) || 0,
      }
    };

    const newId = uuidv4();
    createCharacter(localCampaignId, newId, data);
    setMyCharacterId(newId);
  };

  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <Card className="w-full max-w-4xl bg-gray-950 border-gray-800 shadow-2xl text-white">
        <CardHeader className="border-b border-gray-800 pb-4">
          <CardTitle className="text-2xl font-bold text-center text-red-500">
            Creación Rápida de Personaje
          </CardTitle>
          <p className="text-center text-gray-400 text-sm mt-1">
            Prepara tus atributos y armaduras para entrar al combate
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna 1: Atributos Generales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-800 pb-2">
                Atributos Generales
              </h3>
              
              <div className="grid gap-2">
                <label className="text-sm text-gray-400 font-medium">ID de la Campaña (Sala de Servidor)</label>
                <Input required value={localCampaignId} onChange={e => setLocalCampaignId(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. camp-1" />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm text-gray-400 font-medium">Nombre del Personaje</label>
                <Input required value={name} onChange={e => setName(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. Kaelen" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm text-gray-400 font-medium">Vida Máxima (HP)</label>
                  <Input required type="number" min="1" value={maxHp} onChange={e => setMaxHp(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. 150" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-gray-400 font-medium">Oro Inicial</label>
                  <Input type="number" min="0" value={gold} onChange={e => setGold(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. 100" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-gray-400 font-medium">Ki Máximo</label>
                  <Input type="number" min="0" value={ki} onChange={e => setKi(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. 40" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-gray-400 font-medium">Zeon Máximo</label>
                  <Input type="number" min="0" value={zeon} onChange={e => setZeon(e.target.value)} className="bg-gray-900 border-gray-700" placeholder="Ej. 0" />
                </div>
              </div>
            </div>

            {/* Columna 2: Resistencias (TA) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-800 pb-2">
                Armadura (Total de Armadura - TA)
              </h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.keys(resistances).map((type) => (
                  <div key={type} className="grid gap-1">
                    <label className="text-xs text-gray-400 font-medium">{type}</label>
                    <Input 
                      type="number" 
                      min="0"
                      value={resistances[type as keyof typeof resistances]} 
                      onChange={e => handleResChange(type as keyof typeof resistances, e.target.value)} 
                      className="bg-gray-900 border-gray-700 h-9" 
                      placeholder="0" 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-4">
              <Button type="submit" disabled={!localCampaignId} className="w-full py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50 transition-all active:scale-95 duration-100">
                {localCampaignId ? 'Unirse a la Campaña' : '⚠️ Ingresa el ID de la Campaña'}
              </Button>
            </div>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
