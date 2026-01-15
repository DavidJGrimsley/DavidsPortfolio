import React from "react";
import { MyCards } from "@/components/Categories/MyCards";
import { TabContainer } from "@/components/Navigation/TabContainer";

type CategoryIndexWrapperProps = {
  titleA: string;
  titleB: string;
  category: string;
  introContent?: React.ReactNode;
  footerContent?: React.ReactNode;
};

export function CategoryIndexWrapper({
  titleA,
  titleB,
  category,
  introContent,
  footerContent,
}: CategoryIndexWrapperProps) {
  return (
    <TabContainer titleA={titleA} titleB={titleB} lead={introContent} contentClassName="py-5">
      <MyCards pageCategory={category} />
      {footerContent}
    </TabContainer>
  );
}
