import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Separator } from '@/shared/ui/separator';
import { Spinner } from '@/shared/ui/spinner';

export function ComponentShowcasePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Component Showcase</h1>
      
      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Trading-specific button variants</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="profit">Profit</Button>
          <Button variant="loss">Loss</Button>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators for trading</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="profit">+15.4%</Badge>
          <Badge variant="loss">-8.2%</Badge>
          <Badge variant="neutral">0.0%</Badge>
          <Badge variant="warning">Warning</Badge>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>This is a default alert message.</AlertDescription>
        </Alert>
        
        <Alert variant="destructive">
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>This is an error alert message.</AlertDescription>
        </Alert>
        
        <Alert variant="warning">
          <AlertTitle>Warning Alert</AlertTitle>
          <AlertDescription>This is a warning alert message.</AlertDescription>
        </Alert>
        
        <Alert variant="success">
          <AlertTitle>Success Alert</AlertTitle>
          <AlertDescription>This is a success alert message.</AlertDescription>
        </Alert>
      </div>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>Input fields and selects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
          
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="select">Trading Pair</Label>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select pair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="btcusdt">BTC/USDT</SelectItem>
                <SelectItem value="ethusdt">ETH/USDT</SelectItem>
                <SelectItem value="bnbusdt">BNB/USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>Trading positions table</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>BTC/USDT</TableCell>
                <TableCell><Badge variant="profit">Active</Badge></TableCell>
                <TableCell><Badge variant="profit">+$1,234</Badge></TableCell>
                <TableCell>$10,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ETH/USDT</TableCell>
                <TableCell><Badge variant="loss">Closed</Badge></TableCell>
                <TableCell><Badge variant="loss">-$456</Badge></TableCell>
                <TableCell>$5,000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog and Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Modals</CardTitle>
          <CardDescription>Dialog and Sheet components</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Position</DialogTitle>
                <DialogDescription>
                  Configure your new trading position
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Trading Pair</Label>
                  <Input placeholder="BTC/USDT" />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input placeholder="1000" />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Position Details</SheetTitle>
                <SheetDescription>
                  View and manage your trading position
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold">BTC/USDT</h4>
                  <p className="text-sm text-muted-foreground">Active position</p>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span className="text-sm">Loading data...</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </div>
  );
}
