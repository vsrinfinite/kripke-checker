import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SquareTerminal, Play, FolderOpen, Save, Download, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onRunCheck: () => void;
  onExport?: () => void;
}

export function Header({ onRunCheck, onExport }: HeaderProps) {
  return (
    <Card className="shadow-sm rounded-2xl">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <SquareTerminal className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Modal Logic Model Checker
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Finite Kripke models • configurable frame constraints • bottom-up evaluation
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl" onClick={onRunCheck} id="run-check-btn">
              <Play className="mr-2 h-4 w-4" /> Run Check
            </Button>
            {onExport && (
              <Button variant="outline" className="rounded-xl" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" /> Export DOT
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
