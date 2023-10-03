import {html, noChange, nothing, ReactiveController, ReactiveControllerHost, TemplateResult,} from 'lit';
import {Directive, directive, ElementPart, PartInfo, PartType,} from 'lit/directive.js';

import {
    Config,
    createForm,
    FieldConfig, FieldState,
    FormApi,
    FormSubscription,
    formSubscriptionItems,
    Unsubscribe,
} from 'final-form';


export type { Config } from 'final-form';

const allFormSubscriptionItems = formSubscriptionItems.reduce<FormSubscription>(
    (acc, item) => ((acc[item as keyof FormSubscription] = true), acc),
    {}
);
type ArrayRenderItemCallback<T> = (item: T, register: (name: string)=> TemplateResult, index: number) => TemplateResult;



export class FinalFormController<FormValues> implements ReactiveController {
    #host: ReactiveControllerHost;
    #subscription: FormSubscription = allFormSubscriptionItems;
    #unsubscribe?: Unsubscribe;
    form: FormApi<FormValues>;

    // https://final-form.org/docs/final-form/types/Config
    constructor(
        host: ReactiveControllerHost,
        config: Config<FormValues>,
        subscription?: FormSubscription
    ) {
        (this.#host = host).addController(this);
        if (subscription) {
            this.#subscription = subscription;
        }


        this.form = createForm(config);
    }

    hostConnected() {
        this.#unsubscribe = this.form.subscribe(() => {
            this.#host.requestUpdate();
        }, this.#subscription);
    }

    hostDisconnected() {
        this.#unsubscribe?.();
    }

    // https://final-form.org/docs/final-form/types/FieldConfig
    register = <K extends keyof FormValues>(
        name: K,
        fieldConfig?: FieldConfig<FormValues[K]>
    ) => {
        return registerDirective(this.form, name, fieldConfig);
    };

    array = <K extends keyof FormValues>(name: K,  cb: ArrayRenderItemCallback<unknown>,  _fieldConfig?: FieldConfig<any>) => {
        return renderArrayDirective(this.form, name, cb, _fieldConfig)
    }
    update = <K extends keyof FormValues>(name: K, newValue: any) => {
        this.form.change(name, newValue);
    }

    getValue = <K extends keyof FormValues>(name: K): FieldState<FormValues[K]> | undefined => {
        return this.form.getFieldState(name);
    }





}

class RegisterDirective extends Directive {
    #registered = false;

    constructor(partInfo: PartInfo) {
        super(partInfo);
        console.log(partInfo)
        if (partInfo.type !== PartType.ELEMENT) {
            throw new Error(
                'The `register` directive must be used in the `element` attribute'
            );
        }
    }

    update(
        part: ElementPart,
        [form, name, fieldConfig]: Parameters<this['render']>
    ) {
        if (!this.#registered) {
            form.registerField(
                name,
                (fieldState) => {
                    const { blur, change, focus, value } = fieldState;
                    const el = part.element as HTMLInputElement | HTMLSelectElement;
                    el.name = String(name);
                    if (!this.#registered) {
                        el.addEventListener('blur', () => blur());
                        el.addEventListener('input', (event) =>
                            change(
                                el.type === 'checkbox'
                                    ? (event.target as HTMLInputElement).checked
                                    : (event.target as HTMLInputElement).value
                            )
                        );
                        el.addEventListener('focus', () => focus());
                    }
                    if (el.type === 'checkbox') {
                        (el as HTMLInputElement).checked = value;
                    } else {
                        el.value = value === undefined ? '' : value;
                    }
                },
                { value: true },
                fieldConfig
            );
            this.#registered = true;
        }

        return noChange;
    }

    // Can't get generics carried over from directive call
    render(
        _form: FormApi<any>,
        _name: PropertyKey,
        _fieldConfig?: FieldConfig<any>
    ) {
        return nothing;
    }
}

const registerDirective = directive(RegisterDirective);


class RenderArrayDirective extends Directive {
    #registered = false;
    #value: any[] = [];
    constructor(partInfo: PartInfo) {
        super(partInfo);
        if (partInfo.type !== PartType.CHILD) {
            throw new Error(
                'The `renderArray` directive must be used in text expressions'
            );
        }
    }

    update(
        part: ElementPart,
        [form, name,  cb, fieldConfig]: Parameters<this['render']>
    ) {
if (!this.#registered) {
    form.registerField(name, (fieldState) => {
if (fieldState.value) {
    this.#value = fieldState.value;
}
    }, { value: true }, fieldConfig)
}

        return this.render(form, name,  cb, fieldConfig);
    }

    // Can't get generics carried over from directive call
    render<T>(
        _form: FormApi<any>,
        _name: PropertyKey,
cb: ArrayRenderItemCallback<T>,
        _fieldConfig?: FieldConfig<any>
    ) {

        return html`${this.#value.map((item: T, index: number) => {
          
            const register = (elementName: string) => {
                const name = `${String(_name)}[${index}].${elementName}`;
                return registerDirective(_form,name, _fieldConfig);
            } 
            return cb(item, register as any, index);
        })}`;
    }
}

const renderArrayDirective = directive(RenderArrayDirective);