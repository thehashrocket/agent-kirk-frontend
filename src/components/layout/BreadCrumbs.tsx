// ~/components/layout/BreadCrumbs.tsx
// This component is used to display the breadcrumbs for the current page.

import React from 'react';
import { SlashIcon } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';

export default function BreadCrumbs({ breadcrumbs }: { breadcrumbs: { label: string; href: string }[] }) {
    return (
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={index}>
                    <BreadcrumbItem key={index}>
                        <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator>
                            <SlashIcon className="w-4 h-4" />
                        </BreadcrumbSeparator>
                    )}
                </React.Fragment>
            ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}