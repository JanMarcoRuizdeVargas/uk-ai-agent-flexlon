import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, FileText, Clock, Activity, MessageSquare, Star, HelpCircle, Trash2 } from "lucide-react";
import { BecknMessage } from "@/types/orchestration";

interface BecknLogProps {
  messages: BecknMessage[];
  flaskUrl: string;
  setFlaskUrl: (url: string) => void;
  isCallingFlask: boolean;
  onCallFlaskApi: () => void;
  onClearLogs: () => void;
}

export function BecknLog({
  messages,
  flaskUrl,
  setFlaskUrl,
  isCallingFlask,
  onCallFlaskApi,
  onClearLogs,
}: BecknLogProps) {
  const getStageIcon = (type: BecknMessage["type"]) => {
    switch (type) {
      case "search":
      case "on_search":
        return <Search className="w-4 h-4" />;
      case "select":
      case "on_select":
        return <CheckCircle className="w-4 h-4" />;
      case "init":
      case "on_init":
        return <FileText className="w-4 h-4" />;
      case "confirm":
      case "on_confirm":
        return <CheckCircle className="w-4 h-4" />;
      case "status":
      case "on_status":
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStageColor = (type: BecknMessage["type"]) => {
    const colors = {
      search: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      on_search: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      select: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      on_select: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      init: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      on_init: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      confirm: "bg-green-500/20 text-green-400 border-green-500/30",
      on_confirm: "bg-green-500/20 text-green-400 border-green-500/30",
      status: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      on_status: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const getStageDescription = (type: BecknMessage["type"]) => {
    const descriptions = {
      search: "Discovery request sent - searching for matching grid flexibility services",
      on_search: "Search results received - available compute-energy slots returned",
      select: "Selection made - choosing specific grid window and compute slot",
      on_select: "Selection confirmed - provider acknowledges chosen slot",
      init: "Order initialization - setting up compute-energy reservation",
      on_init: "Initialization response - provider confirms order setup",
      confirm: "Order confirmation - finalizing compute slot reservation",
      on_confirm: "Confirmation received - grid slot reservation confirmed",
      status: "Status check requested - monitoring order fulfillment",
      on_status: "Status update received - current fulfillment state",
    };
    return descriptions[type] || "Message exchanged between agents";
  };

  const formatMessageData = (data: any) => {
    if (!data) return null;

    // Check for Flask API output
    if (data.output) {
      return {
        domain: data.context?.domain || "unknown",
        transaction_id: data.context?.transaction_id?.substring(0, 8) + "...",
        action: data.context?.action || "output",
        output: data.output,
      };
    }

    // Extract key information based on message type
    if (data.context) {
      return {
        domain: data.context.domain,
        transaction_id: data.context.transaction_id?.substring(0, 8) + "...",
        action: data.context.action,
      };
    }
    return null;
  };

  return (
    <Card className="p-6 bg-card border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Beckn Protocol Logs</h3>
          <p className="text-xs text-muted-foreground mt-1">Complete message flow between compute and grid agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {messages.length} Messages
          </Badge>
          <Button onClick={onClearLogs} size="sm" variant="outline" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4 pb-4 border-b border-border">
        <Input
          type="text"
          placeholder="API URL (e.g., http://localhost:5000/api)"
          value={flaskUrl}
          onChange={(e) => setFlaskUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onCallFlaskApi} disabled={isCallingFlask} variant="secondary" className="gap-2">
          {isCallingFlask ? "Calling..." : "Call API"}
        </Button>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No Beckn messages yet</p>
              <p className="text-xs mt-1">Protocol messages will appear as agents communicate</p>
            </div>
          ) : (
            messages.map((message) => {
              const formattedData = formatMessageData(message.data);

              return (
                <div
                  key={message.id}
                  className="p-4 rounded-lg border border-border bg-panel-bg hover:border-primary/50 transition-all animate-slide-in"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded border ${getStageColor(message.type)}`}>
                        {getStageIcon(message.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStageColor(message.type)}>{message.type.toUpperCase()}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {message.from} → {message.to}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground mb-3">{getStageDescription(message.type)}</p>

                  {formattedData && (
                    <div className="p-3 bg-background/50 rounded border border-border">
                      {formattedData.output ? (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Flask Output:</span>
                          <pre className="text-foreground font-mono mt-1 whitespace-pre-wrap break-words">
                            {formattedData.output}
                          </pre>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Domain:</span>
                            <p className="text-foreground font-mono mt-0.5 truncate">{formattedData.domain}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Action:</span>
                            <p className="text-foreground font-mono mt-0.5">{formattedData.action}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Transaction:</span>
                            <p className="text-foreground font-mono mt-0.5">{formattedData.transaction_id}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Protocol Flow Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Protocol Flow:</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            Search/Discover
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            Select
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            Init
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            Confirm
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            Status
          </Badge>
        </div>
      </div>
    </Card>
  );
}
