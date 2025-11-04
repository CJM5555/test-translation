import { parseString, Builder } from "xml2js";
import { StringResource } from "@/types";

export const parseXmlFile = (xmlContent: string): Promise<StringResource[]> => {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const strings: StringResource[] = [];
      if (result.resources && result.resources.string) {
        result.resources.string.forEach((str: any) => {
          strings.push({
            key: str.$.name,
            value: str._,
          });
        });
      }
      resolve(strings);
    });
  });
};

export const generateXmlFile = (strings: StringResource[]): string => {
  const builder = new Builder();
  const obj = {
    resources: {
      string: strings.map((str) => ({
        $: { name: str.key },
        _: str.translatedValue || str.value,
      })),
    },
  };
  return builder.buildObject(obj);
};
