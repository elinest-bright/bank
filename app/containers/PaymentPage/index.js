/*
 * Payment
 *
 * This is the first page thing users see of our App after logging in, at the '/login' route
 *
 * NOTE: while this component should technically be a stateless functional
 * component (SFC), hot reloading does not currently support SFCs. If hot
 * reloading is not a necessity for you then you can refactor it and remove
 * the linting exception.
 */

/* eslint no-nested-ternary: 0 */

import React, { Component, Fragment } from 'react';
import './style.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Helmet from 'react-helmet';
import { withSnackbar } from 'notistack';
import Autosuggest from 'react-autosuggest';
import { debounce } from 'lodash';
import socketIOClient from 'socket.io-client';

// Import Material-UI
import { withStyles } from '@material-ui/core/styles';
import MobileStepper from '@material-ui/core/MobileStepper';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import NavigateNext from '@material-ui/icons/NavigateNext';
import NavigateBefore from '@material-ui/icons/NavigateBefore';
// import { FormattedMessage } from 'react-intl';
import Loading from '../../components/App/Loading';
// import messages from './messages';

import AuthService from '../../services/AuthService';
import withAuth from '../../services/withAuth';

const getSuggestionValue = suggestion => suggestion.account_bill;

const renderSuggestion = suggestion => (
  <div>
    {suggestion.account_bill} <br />
    {suggestion.user.name} {suggestion.user.surname}
  </div>
);

const styles = theme => ({
  button: {
    marginRight: theme.spacing.unit,
  },
  instructions: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  container: {
    margin: '10px auto',
    width: '1100px',
  },
  center: {
    textAlign: 'center',
    maxWidth: 1100,
    margin: '0 auto',
  },
  stepperRoot: {
    width: '80%',
    margin: '0 auto',
  },
  stepperContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  formItem: {
    padding: 10,
    height: 36,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('sm')]: {
      width: '17rem',
    },
    border: '1px solid grey',
    display: 'block',
    margin: '0 auto',
    backgroundColor: 'white',
    fontSize: 14,
    borderRadius: 2,
  },
  formSubmit: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('sm')]: {
      width: '17rem',
    },
    display: 'block',
    margin: '20px auto 0',
    padding: 5,
    height: 36,
    backgroundColor: '#0098db',
    borderRadius: 2,
    color: 'white',

    '&:hover': {
      transition: '0.150s',
      backgroundColor: '#15a0dd',
      cursor: 'pointer',
    },
  },
  formContainer: {
    textAlign: 'center',
    margin: '15px 0',
    width: '100%',
    backgroundColor: '#f2f4f7',
    padding: '15px 0 35px',
  },
  formError: {
    border: '1px solid red',
    borderRadius: 2,
  },
  pageContainer: {
    textAlign: 'center',
  },
  alertContainer: {
    maxWidth: '1024px',
    padding: '10px 3%',
    margin: '10px auto 0',
    borderRadius: 2,
    backgroundColor: '#0098db',
    color: 'white',
  },
  messageContainer: {
    textAlign: 'left',
    [theme.breakpoints.down('md')]: {
      padding: 0,
    },
    [theme.breakpoints.up('md')]: {
      padding: '0 130px',
    },
  },
  textField: {
    margin: '10px auto 0',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('sm')]: {
      width: '17rem',
    },
    textAlign: 'left',
    fontSize: '18px',
    letterSpacing: 0.3,
  },
  textError: {
    color: 'red',
    textAlign: 'left',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('sm')]: {
      width: '17rem',
    },
    margin: '0 auto',
    fontSize: 14.5,
  },
  textMessage: {
    textAlign: 'left',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('sm')]: {
      width: '17rem',
    },
    margin: '0 auto',
    fontSize: 14.5,
  },
  footerText: {
    textAlign: 'left',
    padding: '0 15px',
    margin: '10px -4px',
  },
  footerInfoText: {
    position: 'relative',
    top: 1,
    fontSize: 13,
  },
  footerAlertText: {
    color: 'red',
    fontSize: 13,
  },
  errorIcon: {
    fontSize: 35,
  },
  footerLink: {
    color: '#0098db',
  },
  buttonText: {
    '&:hover': {
      cursor: 'pointer',
    },
  },
  mobileStepper: {
    background: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  mobileStepperDots: {
    margin: '0 auto',
  },
  success: {
    backgroundColor: '#0098db',
  },
  // setAuthorizationCodeBtn: {
  //   display: 'inline-block',
  //   width: 90,
  //   position: 'absolute',
  //   [theme.breakpoints.up('924px')]: {
  //     display: 'none',
  //   },
  //   top: 197,
  //   marginLeft: 20,
  //   marginTop: 0,
  // },
  // formSubmitContainer: {
  //   width: '100%',
  //   textAlign: 'center',
  // },
});

function getSteps() {
  return [
    'Numer rachunku ',
    'Ilość pieniędzy',
    'Tytuł przelewu',
    'Potwierdź dane',
  ];
}

class PaymentPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      senderId: this.props.user.id,
      error: '',
      message: '',
      activeStep: 0,
      accountBills: [],
      value: '',
      isLoading: true,
      endpoint: 'http://localhost:3000',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.Auth = new AuthService();
  }

  getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    if (inputLength === 0) {
      return [];
    }
    return this.state.accountBills.filter(
      accountBill =>
        accountBill.account_bill.toLowerCase().slice(0, inputLength) ===
        inputValue,
    );
  };

  getUserData = debounce(
    newValue =>
      this.Auth.getUsersData(newValue).then(res => {
        if (res) {
          this.setState({ accountBills: res, isLoading: true });
        }
      }),
    400,
  );

  onChange = (event, { newValue }) => {
    this.setState(
      {
        value: newValue,
      },
      () => {
        if (this.state.value.length !== 0 && this.state.value.length !== 26) {
          this.setState({
            isLoading: false,
          });
          this.getUserData(newValue);
        }
      },
    );
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      accountBills: this.getSuggestions(value),
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      accountBills: [],
    });
  };

  getStepContent = step => {
    const { classes } = this.props;
    const { error, accountBills, message } = this.state;
    const { value } = this.state;

    const inputProps = {
      placeholder: 'Wprowadź numer',
      value,
      onChange: this.onChange,
      maxLength: 26,
    };

    switch (step) {
      case 0:
        return (
          <Fragment>
            {!this.state.isLoading ? (
              <Fragment>
                <Loading />
                <br />
              </Fragment>
            ) : null}
            <div className={classes.textField}>Numer rachunku</div>
            <Autosuggest
              className={classNames(classes.formItem, {
                [classes.formError]: error,
              })}
              suggestions={accountBills}
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={renderSuggestion}
              inputProps={inputProps}
            />
            {error ? <div className={classes.textError}>{error}</div> : null}
          </Fragment>
        );
      case 1:
        return (
          <Fragment>
            <div className={classes.textField}>Ilość pieniędzy</div>
            <input
              className={classNames(classes.formItem, {
                [classes.formError]: error,
              })}
              placeholder="Wpisz ilość"
              name="amountMoney"
              type="number"
              onChange={this.handleChange}
            />
            {error ? <div className={classes.textError}>{error}</div> : null}
          </Fragment>
        );
      case 2:
        return (
          <Fragment>
            <div className={classes.textField}>Tytuł przelewu</div>
            <input
              className={classNames(classes.formItem, {
                [classes.formError]: error,
              })}
              placeholder="Wpisz tytuł"
              name="transferTitle"
              type="text"
              onChange={this.handleChange}
            />
            {error ? <div className={classes.textError}>{error}</div> : null}
          </Fragment>
        );
      case 3:
        return (
          <Fragment>
            <div className={classes.formSubmitContainer}>
              <div className={classes.textField}>Potwierdź dane</div>
              <input
                className={classNames(classes.formItem, classes.formSpecial, {
                  [classes.formError]: error,
                })}
                name="authorizationCode"
                placeholder="Wpisz klucz autoryzacji"
                type="text"
                onChange={this.handleChange}
              />
              {error ? <div className={classes.textError}>{error}</div> : null}
              {message ? (
                <div className={classes.textMessage}>{message}</div>
              ) : null}

              <button
                type="button"
                className={classNames(
                  classes.formSubmit,
                  classes.setAuthorizationCodeBtn,
                )}
                onClick={this.handleFormCheckout}
              >
                <span className={classes.buttonText}>Wyślij kod</span>
              </button>
            </div>
          </Fragment>
        );
      default:
        return 'Unknown step';
    }
  };

  validateNumber(e) {
    const re = /[0-9]+/g;
    if (!re.test(e.key)) {
      e.preventDefault();
    }
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }

  isAccountBill = e => {
    e.preventDefault();

    if (this.state.value === '') {
      this.setState({
        error: 'Proszę wprowadzić numer rachunku',
      });
      return;
    }

    this.Auth.isAccountBill(this.state.value)
      .then(res => {
        if (res.isAccountBill) {
          this.setState(state => ({
            activeStep: state.activeStep + 1,
          }));

          this.setState({
            error: '',
          });
          document.getElementsByTagName('input').amountMoney.value = '';
        } else {
          this.setState({
            error: 'Proszę wprowadzić prawidlowy numer rachunku',
          });
        }
      })
      .catch(() => {
        /* just ignore */
      });
  };

  isAmountMoney = e => {
    e.preventDefault();

    if (this.state.amountMoney === '') {
      this.setState({
        error: 'Proszę wprowadzić kwotę',
      });
      return;
    }

    this.Auth.isAmountMoney(this.state.senderId, this.state.amountMoney)
      .then(res => {
        if (res.isAmountMoney) {
          this.setState(state => ({
            activeStep: state.activeStep + 1,
          }));

          this.setState({
            error: '',
          });
          document.getElementsByTagName('input').transferTitle.value = '';
        } else {
          this.setState({
            error: 'Proszę wprowadzić prawidłową kwotę',
          });
        }
      })
      .catch(() => {
        /* just ignore */
      });
  };

  handleFormCheckout = e => {
    e.preventDefault();

    this.Auth.registerTransaction(
      this.state.senderId,
      this.state.value,
      this.state.amountMoney,
      this.state.transferTitle,
    )
      .then(res => {
        if (!res.error) {
          this.setState({
            message: 'Klucz został wysłany',
            error: '',
          });
        } else {
          this.setState({
            message: 'Przerwa techniczna. Spróbuj za chwilę.',
          });
        }
      })
      .catch(() => {
        this.setState({
          error: 'Przerwa techniczna. Spróbuj za chwilę.',
        });
      });
  };

  handleFormSubmit = variant => e => {
    e.preventDefault();

    this.Auth.confirmTransaction(
      this.state.senderId,
      this.state.value,
      this.state.amountMoney,
      this.state.transferTitle,
      this.state.authorizationCode,
    )
      .then(res => {
        if (!res.error) {
          this.props.enqueueSnackbar('Przelew został wykonany.', {
            variant,
          });

          const socket = socketIOClient(this.state.endpoint);
          socket.emit('new notification');

          this.props.history.replace('/dashboard');
        } else {
          this.setState({
            error: 'Niepoprawny klucz autoryzacji.',
            message: '',
          });
        }
      })
      .catch(() => {
        this.setState({
          error: 'Przerwa techniczna. Spróbuj za chwilę.',
        });
      });
  };

  handleNext = () => {
    const { activeStep, amountMoney, transferTitle } = this.state;

    if (activeStep === 1 && amountMoney === '') {
      document.getElementsByTagName('input').amountMoney.value = '';
      this.setState({
        error: 'Proszę podać hasło',
      });
    } else if (activeStep === 2 && transferTitle === '') {
      document.getElementsByTagName('input').transferTitle.value = '';
      this.setState({
        error: 'Proszę podać imię',
      });
    } else {
      this.setState({
        activeStep: activeStep + 1,
        error: '',
      });

      if (activeStep === 1) {
        document.getElementsByTagName('input').amountMoney.value = '';
      } else if (activeStep === 2) {
        document.getElementsByTagName('input').transferTitle.value = '';
      }
    }
  };

  handleBack = () => {
    const { activeStep, value, amountMoney, transferTitle } = this.state;

    if (activeStep === 1 && value !== '') {
      this.setState({
        value: '',
      });
    } else if (activeStep === 2 && amountMoney !== '') {
      this.setState({
        amountMoney: '',
      });
    } else if (activeStep === 3 && transferTitle !== '') {
      this.setState({
        transferTitle: '',
      });
    }

    this.setState({
      activeStep: activeStep - 1,
      error: '',
    });
  };

  render() {
    const { classes } = this.props;
    const steps = getSteps();
    const { activeStep } = this.state;

    return (
      <Fragment>
        <Helmet title="Payment · Bank Application" />
        <div className={classes.center}>
          <MobileStepper
            variant="dots"
            steps={5}
            position="static"
            activeStep={this.state.activeStep}
            classes={{
              root: classes.mobileStepper,
              dots: classes.mobileStepperDots,
            }}
          />
          <Stepper className={classes.stepperContainer} activeStep={activeStep}>
            {steps.map(label => {
              const props = {};
              const labelProps = {};
              return (
                <Step key={label} {...props}>
                  <StepLabel {...labelProps}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
          <div>
            {activeStep === steps.length ? null : (
              <div>
                <div className={classes.instructions}>
                  <form noValidate onSubmit={this.handleFormSubmit('success')}>
                    {this.getStepContent(activeStep)}
                  </form>
                </div>
                {activeStep === steps.length - 1 ? (
                  <button
                    className={classes.formSubmit}
                    type="submit"
                    onClick={this.handleFormSubmit('success')}
                  >
                    <span className={classes.buttonText}>Wykonaj płatność</span>
                  </button>
                ) : (
                  [
                    activeStep === 0 ? (
                      <button
                        key={1}
                        type="button"
                        className={classes.formSubmit}
                        onClick={this.isAccountBill}
                        disabled={this.state.activeStep === 4}
                      >
                        <span className={classes.buttonText}>Dalej</span>
                        <NavigateNext />
                      </button>
                    ) : activeStep === 1 ? (
                      <button
                        type="button"
                        key={2}
                        className={classes.formSubmit}
                        onClick={this.isAmountMoney}
                        disabled={this.state.activeStep === 4}
                      >
                        <span className={classes.buttonText}>Dalej</span>
                        <NavigateNext />
                      </button>
                    ) : (
                      <button
                        type="button"
                        key={3}
                        className={classes.formSubmit}
                        onClick={this.handleNext}
                        disabled={this.state.activeStep === 4}
                      >
                        <span className={classes.buttonText}>Dalej</span>
                        <NavigateNext />
                      </button>
                    ),
                  ]
                )}

                {activeStep !== 0 ? (
                  <button
                    type="button"
                    disabled={this.state.activeStep === 0}
                    onClick={this.handleBack}
                  >
                    <NavigateBefore />
                    <span className={classes.buttonText}>Powrót</span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Fragment>
    );
  }
}

PaymentPage.propTypes = {
  classes: PropTypes.object,
  theme: PropTypes.object.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
};

export default withAuth(
  withStyles(styles, { withTheme: true })(withSnackbar(PaymentPage)),
);
