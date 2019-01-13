import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
} from '../../../../core/store/gantt-charts/gantt-chart.model';
import * as frappeGantt from 'frappe-gantt';
import * as moment from 'moment';

declare let $: any;

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: GanttChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  public gantt_chart: frappeGantt;

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
  }

  private visualize() {
    if (
      this.config.mode &&
      this.config.barsProperties[GanttChartBarPropertyRequired.NAME] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.START] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.END]
    ) {
      const tasks = [];

      for (const document of this.documents) {
        const name = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.NAME].attributeId];
        const start = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.START].attributeId];
        const end = document.data[this.config.barsProperties[GanttChartBarPropertyRequired.END].attributeId];

        let id = null,
          dependencies = null,
          progress = null;

        if (this.config.barsProperties[GanttChartBarPropertyOptional.ID])
          id = document.data[this.config.barsProperties[GanttChartBarPropertyOptional.ID].attributeId];
        if (this.config.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES])
          dependencies =
            document.data[this.config.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES].attributeId];
        if (this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS])
          progress = document.data[this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId];

        tasks.push({
          name: name,
          start: start,
          end: end,
          id: id,
          dependencies: dependencies,
          progress: progress,
          document_id: document.id,
        });
      }

      if (tasks.length > 0) {
        this.gantt_chart = new frappeGantt.default('#ganttChart', tasks, {
          on_date_change: (task, start, end) => {

            let startAttID = this.config.barsProperties[GanttChartBarPropertyRequired.START].attributeId;
            let endAttID = this.config.barsProperties[GanttChartBarPropertyRequired.END].attributeId;

            let startTimeTask = moment(task.start, "YYYY-MM-DD").local();
            let startTime = moment(start, 'YYYY-MM-DD').local();

            let endTimeTask = moment(task.end, 'YYYY-MM-DD').local();
            let endTime = moment(end, 'YYYY-MM-DD').local();

            //start time changed
            if (startTimeTask != startTime) this.onValueChanged(task.document_id, startAttID, startTime.format('YYYY-MM-DD'));

            //end time changed
            if (endTimeTask != endTime) this.onValueChanged(task.document_id, endAttID, endTime.format('YYYY-MM-DD'));
          },

          on_progress_change: (task, progress) => {
            let progressAttID = this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId;

            this.onValueChanged(task.document_id, progressAttID, progress);
          },
        });
        this.gantt_chart.change_view_mode(this.config.mode);

        let textColor = this.getContrastYIQ(this.collection.color.substring(1, 6));
        $('.gantt .bar').css('fill', this.collection.color);
        $('.gantt .bar-label').css('fill', textColor);
        if (textColor == 'black') {
          $('.gantt .bar-progress').css('fill', this.shadeColor2(this.collection.color, 50));
        } else {
          $('.gantt .bar-progress').css('fill', this.shadeColor2(this.collection.color, 0.3));
        }
      }
    }
  }

  private onValueChanged(documentId: string, attributeId: string, value: string) {
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const patchDocument = {...changedDocument, data: {[attributeId]: value}};
    this.patchData.emit(patchDocument);
  }

  private getContrastYIQ(hexcolor) {
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'black' : 'white';
  }

  private shadeColor2(color, percent) {
    var f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff;
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1)
    );
  }
}
