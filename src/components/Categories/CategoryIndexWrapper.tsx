import React from "react";
import { MyCards } from "@/components/Categories/MyCards";
import { TabContainer } from "@/components/Navigation/TabContainer";

type CategoryIndexWrapperProps = {
  titleA: string;
  titleB: string;
  category: string;
  introBody?: string;
  introSubBody?: string;
  footerContent?: React.ReactNode;
};

export function CategoryIndexWrapper({
  titleA,
  titleB,
  category,
  introBody,
  introSubBody,
  footerContent,
}: CategoryIndexWrapperProps) {
  return (
    <TabContainer
      titleA={titleA}
      titleB={titleB}
      leadBody={introBody}
      leadSubBody={introSubBody}
      contentClassName="py-5"
    >
      <MyCards pageCategory={category} />
      {footerContent}
    </TabContainer>
  );
}
