import { COUNTRY_CONFIGURATIONS } from '../../3-infraestructure/database/config/country-configurations';
import { Checker } from '../../3-infraestructure/helper/checker';
import { ITemplateManager } from '../../3-infraestructure/helper/i-template-manager';
import { FileManager } from '../../3-infraestructure/helper/import/file-manager';
import { PathManager } from '../../3-infraestructure/helper/import/path-manager';
import { Logger } from '../../3-infraestructure/helper/logger';
import { Printer } from '../../3-infraestructure/helper/printer';
import { TemplateManager } from '../../3-infraestructure/helper/template-manager';
import { CountryConfiguration } from '../../3-infraestructure/models/country-configuration';
import { ShoppingCart } from '../../3-infraestructure/models/shopping-cart';

export class DocumentManager {
  protected readonly countryConfigurations: CountryConfiguration[] = COUNTRY_CONFIGURATIONS;
  protected readonly checker = new Checker();
  protected readonly invoicePrefix = `invoice-`;
  protected readonly orderPrefix = `order-`;
  protected readonly templateManager = new TemplateManager();
  protected readonly fileManager = new FileManager();
  protected readonly pathManager = new PathManager();
  protected readonly logger = new Logger();
  protected readonly emailFolder = this.pathManager.emailFolder;
  protected readonly Printer = Printer;

  protected iTemplateManager: ITemplateManager | undefined;
  // protected abstract getTemplateManager() { }
  // public send( shoppingCart: ShoppingCart) { };

  public sendOrder( shoppingCart: ShoppingCart ) {
    const orderContent = this.templateManager.getOrderTemplate( shoppingCart );
    const orderMessageTemplate = this.templateManager.getOrderMessageTemplate( orderContent );
    this.fileManager.ensureFolder( this.emailFolder );
    const orderFileName = this.getOrderFileName( shoppingCart );
    this.fileManager.writeFile( { path: orderFileName, content: orderMessageTemplate } );
    this.logger.print( 'Sent Order: ' + shoppingCart.legalAmounts.invoiceNumber );
  }

  public sendInvoice( shoppingCart: ShoppingCart ) {
    const invoiceTemplate = this.templateManager.getInvoiceTemplate( shoppingCart );
    this.printInvoice( shoppingCart, invoiceTemplate );
    this.sendEmailInvoice( shoppingCart.client.email, invoiceTemplate );
    this.logger.print( 'Sent Invoice: ' + shoppingCart.legalAmounts.invoiceNumber );
  }

  private sendEmailInvoice( emailAddress: string, invoiceContent: string ) {
    const invoiceMessageTemplate = this.templateManager.getInvoiceMessageTemplate(
      invoiceContent
    );
    this.fileManager.ensureFolder( this.emailFolder );
    const invoiceFileName = this.getInvoiceFileName( emailAddress );
    this.fileManager.writeFile( { path: invoiceFileName, content: invoiceMessageTemplate } );
  }

  private printInvoice( shoppingCart: ShoppingCart, documentContent: string ) {
    const fileName = `${this.invoicePrefix}${shoppingCart.legalAmounts.invoiceNumber}.txt`;
    Printer.printContentToFile( { fileName, textContent: documentContent } );
  }

  private getOrderFileName( shoppingCart: ShoppingCart ) {
    const customerCountry: string = shoppingCart.client.country;
    const warehouseEmailAddress = this.getWarehouseAddressByCountry( customerCountry );
    const orderFileName = `${this.orderPrefix}${
      shoppingCart.legalAmounts.invoiceNumber
    }_${warehouseEmailAddress}.txt`;
    const fileName = this.pathManager.join( this.emailFolder, orderFileName );
    return fileName;
  }

  private getWarehouseAddressByCountry( customerCountry: string ) {
    const countryConfiguration = this.checker.findSafe(
      this.countryConfigurations,
      country => country.countryName === customerCountry
    );
    return countryConfiguration.warehouseAddress;
  }

  private getInvoiceFileName( emailAddress: string ) {
    const invoiceFileName = `${this.invoicePrefix}${emailAddress}.txt`;
    const fileName = this.pathManager.join( this.emailFolder, invoiceFileName );
    return fileName;
  }
}
