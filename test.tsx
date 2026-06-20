import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const Schema = z.object({
  name: z.string(),
  tags: z.array(z.string()).default([]),
});

type Input = z.input<typeof Schema>;
type Output = z.infer<typeof Schema>;

export function App() {
  const form = useForm<Input, any, Output>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = (data: Output) => {
    console.log(data.tags.length);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)} />;
}
