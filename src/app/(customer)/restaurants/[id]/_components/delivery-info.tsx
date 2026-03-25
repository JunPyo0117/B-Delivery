import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike } from "lucide-react";

interface DeliveryInfoProps {
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
}

export function DeliveryInfo({
  minOrderAmount,
  deliveryFee,
  deliveryTime,
}: DeliveryInfoProps) {
  return (
    <div>
      <Tabs defaultValue="delivery">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="delivery">배달</TabsTrigger>
          <TabsTrigger value="pickup" disabled>
            포장
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="mt-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">최소주문</span>
              <span className="font-medium">
                {minOrderAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Bike className="size-4" />
                배달
              </span>
              <div className="text-right">
                <span className="font-medium">{deliveryTime}분</span>
                <span className="ml-2 text-muted-foreground">
                  {deliveryFee > 0
                    ? `${deliveryFee.toLocaleString()}원`
                    : "무료배달"}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
