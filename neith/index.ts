export interface NeithProp {
    name: string, 
    value: string
}

export interface NeithElement {
    tag: string,
    props: NeithProp[],
    text: string,
    children: NeithElement[],
}