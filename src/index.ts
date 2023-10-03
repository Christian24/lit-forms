import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { styles } from './styles.js';
import { FinalFormController, Config } from './final-form-controller.js';

import '@material/web/textfield/filled-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/progress/circular-progress.js';

interface Employee {
    firstName: string;
    lastName: string;
    color: '#FF0000' | '#00FF00' | '#0000FF';
    employed: boolean;
}
interface FormValues {
    employees: Employee[];
}

// https://final-form.org/docs/final-form/types/Config
const formConfig: Config<FormValues> = {
    onSubmit: async (values) => {
        await new Promise((r) => setTimeout(r, 500));
        window.alert(JSON.stringify(values, null, 2));
    },
    validate: (values) => {
        const errors: Partial<Record<keyof FormValues, string>> = {};
      /*  if (!values.firstName) {
            errors.firstName = 'Required';
        }
        if (!values.lastName) {
            errors.lastName = 'Required';
        }*/
        return errors;
    },
};

@customElement('final-form-demo')
export class FinalFormDemo extends LitElement {
    static styles = styles;

    #controller = new FinalFormController(this, formConfig);

    render() {
        const { form, register, array, getValue, update } = this.#controller;
        const formState = form.getState();

        return html`
      <form
        id="form"
        @submit=${(e: Event) => {
            e.preventDefault();
            form.submit();
        }}
      >
        <h1>🏁 Final Form - Lit Demo</h1>
        <p>
          Adapted from
          <a
            href="https://final-form.org/docs/final-form/examples/vanilla"
            target="_blank"
            rel="noopener noreferrer"
            >https://final-form.org/docs/final-form/examples/vanilla</a
          >
        </p>
        <p>
          Uses record level validation. Errors don't show up until a field is
          "touched" or a submit is attempted. Errors disappear immediately as
          the user types.
        </p>
        ${array('employees',(item: Employee, register, index) => {
                return html`
                    <div>
                        <label>First Name</label>
                        <md-filled-text-field
                                type="text"
                                placeholder="First Name"
${register('firstName')}
                                ?error=${
                                        formState.touched?.firstName && formState.errors?.firstName
                                }
                                .errorText=${formState.errors?.firstName}
                        ></md-filled-text-field>
                    </div>
                    <div>
                        <label>Last Name</label>
                        <md-filled-text-field
                                type="text"
                                placeholder="Last Name"
                                ${register('lastName')}
                                ?error=${formState.touched?.lastName && formState.errors?.lastName}
                                .errorText=${formState.errors?.lastName}
                        ></md-filled-text-field>
                    </div>
                    <div>
                        <label>Favorite Color</label>
                        <md-filled-select
${register('color')}
                                ?error=${formState.touched?.color && formState.errors?.color}
                                .errorText=${formState.errors?.color}
                        >
                            <md-select-option value="#FF0000" >
                                <div slot="headline">Red</div>
                            </md-select-option>
                            <md-select-option value="#00FF00" >
                                <div slot="headline">Green</div>
                            </md-select-option>
                            <md-select-option value="#0000FF"> <div slot="headline">Blue</div></md-select-option>
                        </md-filled-select>
                    </div>
                    <div>
                        <label>Employed?</label>
                        <md-checkbox ${register('employed')} .type=${'checkbox'}></
                        <md-checkbox>
                    </div>`;
            }
        )}
        
          <div>
              <md-filled-button type="button" @click="${() => {
                  const value = getValue('employees')?.value ? getValue('employees')!.value! : [];
                  
                update('employees', [...value, {color: undefined, employed: false, firstName: '', lastName: ''}] ); 
              }}" >
                 
                              Add employee
              
              </md-filled-button>
          </div>
        <div>
          <md-filled-button type="submit" ?disabled=${formState.submitting}>${
            formState.submitting
                ? html`<md-circular-progress indeterminate style="--md-circular-progress-size: 30px;"></md-circular-progress>`
                : 'Submit'
        }
          </md-filled-button>
          <md-outlined-button 
            type="button"
            id="reset"
            @click=${() => {
            form.restart();
        }}
          >
            Reset
          </md-outlined-button>
        </div>
      </form>
      <pre>${JSON.stringify(formState, null, 2)}</pre>
    `;
    }
}
