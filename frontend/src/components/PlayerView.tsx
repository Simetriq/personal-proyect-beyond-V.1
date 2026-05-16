import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function PlayerView() {
  return (
    <div className="grid grid-cols-12 gap-4 h-full p-4 text-white">
      
      {/* Panel Izquierdo: Estado Vital */}
      <div className="col-span-3 flex flex-col gap-4">
        <Card className="border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-red-500">Estado Vital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">HP (Vida)</span>
                <span className="text-red-400 font-bold">120 / 150</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">Ki</span>
                <span className="text-blue-400 font-bold">45</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">Zeon</span>
                <span className="text-purple-400 font-bold">200</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Calculadora de Daño</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input type="number" placeholder="Daño Recibido..." className="text-lg py-6 bg-gray-900 border-gray-700" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">Filo</Button>
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">Contundente</Button>
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">Penetrante</Button>
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800">Calor</Button>
            </div>
            <Button className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg">Aplicar Daño</Button>
          </CardContent>
        </Card>
      </div>

      {/* Panel Central: Inventario y Tienda */}
      <div className="col-span-6 h-full">
        <Card className="h-full border-gray-800 flex flex-col bg-card/50">
          <Tabs defaultValue="inventory" className="w-full h-full flex flex-col">
            <CardHeader className="pb-0 pt-4 border-b border-gray-800">
              <TabsList className="w-full grid grid-cols-2 bg-gray-900/80">
                <TabsTrigger value="inventory" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Mi Inventario</TabsTrigger>
                <TabsTrigger value="shop" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Tienda del Mercader</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-grow p-0 pt-4">
              <TabsContent value="inventory" className="h-full m-0 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Equipamiento</h3>
                  <span className="text-yellow-500 font-bold flex items-center gap-2">
                    💰 150 Oro
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead>Ítem</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <TableCell className="font-medium text-gray-200">Poción de Curación Menor</TableCell>
                      <TableCell className="text-gray-300">3</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="secondary" className="bg-gray-800 hover:bg-gray-700">Consumir</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <TableCell className="font-medium text-gray-200">Ración de Viaje</TableCell>
                      <TableCell className="text-gray-300">5</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="secondary" className="bg-gray-800 hover:bg-gray-700">Consumir</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="shop" className="h-full m-0 p-4">
                <div className="flex justify-center items-center h-40 text-gray-500 italic">
                  El mercader está preparando sus mercancías...
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Panel Derecho: Alertas */}
      <div className="col-span-3 flex flex-col gap-4">
        <Card className="border-yellow-500/30 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-500 flex items-center gap-2">
              ⚠️ Recordatorios y Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* Mock alert */}
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-md animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              <p className="text-red-400 font-semibold text-sm">
                ¡Salud Crítica! (Menos del 30%). Recuerda activar tu dote de supervivencia si recibes otro ataque mortal.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-400 text-sm mb-2">Efectos Activos</h4>
              <div className="text-sm p-3 bg-gray-900/80 rounded border border-gray-800 text-gray-300 shadow-inner">
                <span className="text-blue-400 font-bold mr-2">Celeridad</span>
                +20 Iniciativa (2 asaltos restantes)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
