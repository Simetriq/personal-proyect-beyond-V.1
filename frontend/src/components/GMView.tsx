import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";

export function GMView() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 text-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-card/80 p-5 rounded-lg border border-gray-800 shadow-md backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Consola de Director de Juego</h1>
          <p className="text-gray-400 text-sm mt-1">Campaña: La Sombra del Omega</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold transition-all hover:scale-105">
          Siguiente Asalto ⏩
        </Button>
      </div>

      {/* Grid de Jugadores */}
      <Card className="flex-grow border-gray-800 bg-card/50">
        <CardHeader>
          <CardTitle>Jugadores Conectados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead>Personaje</TableHead>
                <TableHead className="w-[200px]">Vida (HP)</TableHead>
                <TableHead>Ki / Zeon</TableHead>
                <TableHead>Oro</TableHead>
                <TableHead>Efectos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Mock Row 1 */}
              <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <TableCell className="font-bold text-lg text-gray-200">Kaelen (Guerrero)</TableCell>
                <TableCell>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400 font-bold">45 / 150</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                    <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-blue-400 text-xs font-semibold">Ki: 45</div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">Zeon: 10</div>
                </TableCell>
                <TableCell className="text-yellow-500 font-semibold">150</TableCell>
                <TableCell>
                  <span className="bg-red-950/60 text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 shadow-sm">Hemorragia (3)</span>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300">Editar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Editar a Kaelen</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-gray-400">HP Actual</label>
                          <Input type="number" defaultValue="45" className="col-span-3 border-gray-700 bg-gray-900 text-white" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label className="text-right text-gray-400">Oro</label>
                          <Input type="number" defaultValue="150" className="col-span-3 border-gray-700 bg-gray-900 text-white" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="bg-green-600 hover:bg-green-700 text-white">Guardar Cambios</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>

              {/* Mock Row 2 */}
              <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <TableCell className="font-bold text-lg text-gray-200">Lyra (Maga)</TableCell>
                <TableCell>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400 font-bold">80 / 80</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-blue-400 text-xs font-semibold">Ki: 0</div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">Zeon: 300</div>
                </TableCell>
                <TableCell className="text-yellow-500 font-semibold">850</TableCell>
                <TableCell>
                  <span className="bg-blue-950/60 text-blue-300 text-xs px-2 py-1 rounded border border-blue-900/50 shadow-sm">Vuelo (10)</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300">Editar</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
