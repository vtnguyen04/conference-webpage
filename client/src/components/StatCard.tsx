import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </CardContent>
    </Card>
);

export default StatCard;