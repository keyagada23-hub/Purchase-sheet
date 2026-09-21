
export function useToast() {
  return {
    toast: (props: any) => {
      alert(props.title + '\n' + props.description);
    }
  };
}
